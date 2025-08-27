import sql from "@/app/api/utils/sql";

// Get all presentations
export async function GET() {
  try {
    const presentations = await sql`
      SELECT p.*, 
             COUNT(s.id) as slide_count
      FROM presentations p
      LEFT JOIN slides s ON p.id = s.presentation_id
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `;
    
    return Response.json({ presentations });
  } catch (error) {
    console.error('Error fetching presentations:', error);
    return Response.json({ error: 'Failed to fetch presentations' }, { status: 500 });
  }
}

// Create new presentation
export async function POST(request) {
  try {
    const { title, description } = await request.json();
    
    if (!title) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }
    
    const [presentation] = await sql`
      INSERT INTO presentations (title, description)
      VALUES (${title}, ${description || ''})
      RETURNING *
    `;
    
    return Response.json({ presentation });
  } catch (error) {
    console.error('Error creating presentation:', error);
    return Response.json({ error: 'Failed to create presentation' }, { status: 500 });
  }
}