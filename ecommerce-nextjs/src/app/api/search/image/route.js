import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { OpenAI } from 'openai';

function parseMessageContent(content) {
  if (!content) return 'No description available';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.type === 'text' && item?.text) return item.text;
        if (item?.type === 'image_url' && item?.image_url?.url) return item.image_url.url;
        return '';
      })
      .filter(Boolean)
      .join(' ')
      .trim();
  }
  return String(content);
}

export async function POST(request) {
  try {
    await connectDB();
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const imageUrlField = formData.get('imageUrl');

    let imageUrl = null;

    if (imageUrlField && typeof imageUrlField === 'string' && imageUrlField.trim()) {
      imageUrl = imageUrlField.trim();
    } else if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString('base64');
      imageUrl = `data:${imageFile.type};base64,${base64Image}`;
    }

    if (!imageUrl) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    const client = new OpenAI({
      baseURL: 'https://router.huggingface.co/v1',
      apiKey: process.env.HUGGINGFACE_API_KEY,
    });

    const chatCompletion = await client.chat.completions.create({
      model: 'google/gemma-4-31B-it:novita',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'This is for an e-commerce website. Describe this image in one short sentence. Then, list 2 to 5 simple tags for the main objects or items visible in the image. Format: Description: [short description]. Tags: [tag1, tag2, tag3, ...]',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
    });

    const description = parseMessageContent(chatCompletion.choices?.[0]?.message?.content);

    // Parse description and tags from the response
    const descMatch = description.match(/Description:\s*(.+?)(?:\s*Tags:|$)/i);
    const tagsMatch = description.match(/Tags:\s*(.+)/i);

    const parsedDescription = descMatch ? descMatch[1].trim() : description;
    const tagsString = tagsMatch ? tagsMatch[1].trim() : '';
    const tags = tagsString
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 5); // Limit to 5 tags

    console.log('Image description:', parsedDescription);
    console.log('Extracted tags:', tags);

    const searchQuery = tags.join(' ');

    // Search using tags field first
    let products = await Product.find({
      tags: { $in: tags }
    }).limit(12);

    // If no tag matches, try text search
    if (products.length === 0) {
      try {
        products = await Product.find({
          $text: { $search: searchQuery }
        }).limit(12);
      } catch (err) {
        // Text search might fail, use fallback
        products = [];
      }
    }

    // Final fallback: search by tags in name and description
    if (products.length === 0) {
      const keywordRegexes = tags.map((tag) => new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));

      products = await Product.find({
        $or: keywordRegexes.flatMap((regex) => [
          { name: regex },
          { description: regex },
          { category: regex },
          { tags: regex },
        ]),
      }).limit(12);
    }

    return Response.json({
      products,
      description: parsedDescription,
      tags,
      searchType: 'image',
    });
  } catch (error) {
    console.error('Image search error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
