import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=").trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in environment");
}

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ["user", "seller", "admin"], default: "seller" },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    price: Number,
    category: String,
    images: [String],
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    stock: Number,
    isActive: Boolean,
    tags: [String],
    sustainability: {
      ecoFriendly: Boolean,
      recyclable: Boolean,
      organic: Boolean,
      carbonFootprint: String,
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB Atlas");

  const hashed = await bcrypt.hash("Seller@123", 12);

  const seller = await User.findOneAndUpdate(
    { email: "seller@ecocommerce.com" },
    {
      $set: {
        name: "Eco Seller",
        password: hashed,
        role: "seller",
        isVerified: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const sampleProducts = [
    {
      name: "Bamboo Toothbrush",
      description: "Eco-friendly toothbrush made with biodegradable bamboo.",
      price: 99,
      category: "Personal Care",
      images: [],
      seller: seller._id,
      stock: 120,
      isActive: true,
      tags: ["bamboo", "eco", "daily-use"],
      sustainability: {
        ecoFriendly: true,
        recyclable: true,
        organic: false,
        carbonFootprint: "low",
      },
    },
    {
      name: "Reusable Steel Bottle",
      description: "Insulated steel bottle to reduce single-use plastic waste.",
      price: 699,
      category: "Lifestyle",
      images: [],
      seller: seller._id,
      stock: 75,
      isActive: true,
      tags: ["reusable", "steel", "hydration"],
      sustainability: {
        ecoFriendly: true,
        recyclable: true,
        organic: false,
        carbonFootprint: "low",
      },
    },
    {
      name: "Organic Cotton Tote Bag",
      description: "Durable tote bag made from certified organic cotton.",
      price: 299,
      category: "Fashion",
      images: [],
      seller: seller._id,
      stock: 150,
      isActive: true,
      tags: ["organic", "cotton", "tote"],
      sustainability: {
        ecoFriendly: true,
        recyclable: false,
        organic: true,
        carbonFootprint: "very low",
      },
    },
  ];

  for (const product of sampleProducts) {
    await Product.updateOne(
      { name: product.name, seller: seller._id },
      { $set: product },
      { upsert: true }
    );
  }

  const count = await Product.countDocuments({ seller: seller._id });
  console.log(`Seed complete. Seller: ${seller.email}, Products: ${count}`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Seed failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
