import connectDB from "@/lib/db";
import Product from "@/models/Product";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aurakriti.vercel.app";

export default async function sitemap() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Static routes
    const staticRoutes = [
      {
        url: `${baseUrl}/`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 1,
      },
      {
        url: `${baseUrl}/shop`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      },
    ];

    // Fetch active products from database
    const products = await Product.find(
      { isActive: true },
      { _id: 1, updatedAt: 1 }
    )
      .limit(50000)
      .lean();

    // Generate dynamic product routes
    const productRoutes = products.map((product) => ({
      url: `${baseUrl}/products/${product._id}`,
      lastModified: product.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...productRoutes];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return [];
  }
}
