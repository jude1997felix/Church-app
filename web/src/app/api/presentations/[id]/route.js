import sql from "@/app/api/utils/sql";

// Get single presentation with slides
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const [presentation] = await sql`
      SELECT * FROM presentations WHERE id = ${id}
    `;
    
    if (!presentation) {
      return Response.json({ error: 'Presentation not found' }, { status: 404 });
    }
    
    const slides = await sql`
      SELECT * FROM slides 
      WHERE presentation_id = ${id}
      ORDER BY position_order ASC
    `;
    
    return Response.json({ presentation: { ...presentation, slides } });
  } catch (error) {
    console.error('Error fetching presentation:', error);
    return Response.json({ error: 'Failed to fetch presentation' }, { status: 500 });
  }
}

// Update presentation
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { title, description } = await request.json();
    
    const [presentation] = await sql`
      UPDATE presentations 
      SET title = ${title}, 
          description = ${description},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (!presentation) {
      return Response.json({ error: 'Presentation not found' }, { status: 404 });
    }
    
    return Response.json({ presentation });
  } catch (error) {
    console.error('Error updating presentation:', error);
    return Response.json({ error: 'Failed to update presentation' }, { status: 500 });
  }
}

// Delete presentation
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const [presentation] = await sql`
      DELETE FROM presentations WHERE id = ${id}
      RETURNING *
    `;
    
    if (!presentation) {
      return Response.json({ error: 'Presentation not found' }, { status: 404 });
    }
    
    return Response.json({ message: 'Presentation deleted successfully' });
  } catch (error) {
    console.error('Error deleting presentation:', error);
    return Response.json({ error: 'Failed to delete presentation' }, { status: 500 });
  }
}