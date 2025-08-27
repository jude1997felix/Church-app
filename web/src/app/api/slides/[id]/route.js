import sql from "@/app/api/utils/sql";

// Update slide
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const updateData = await request.json();
    
    // Build dynamic update query
    const allowedFields = [
      'title', 'content', 'slide_type', 'background_color', 
      'text_color', 'font_size', 'position_order', 'notes'
    ];
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (updates.length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    
    values.push(id); // Add ID as the last parameter
    const query = `
      UPDATE slides 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const [slide] = await sql(query, values);
    
    if (!slide) {
      return Response.json({ error: 'Slide not found' }, { status: 404 });
    }
    
    return Response.json({ slide });
  } catch (error) {
    console.error('Error updating slide:', error);
    return Response.json({ error: 'Failed to update slide' }, { status: 500 });
  }
}

// Delete slide
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const [slide] = await sql`
      DELETE FROM slides WHERE id = ${id}
      RETURNING *
    `;
    
    if (!slide) {
      return Response.json({ error: 'Slide not found' }, { status: 404 });
    }
    
    return Response.json({ message: 'Slide deleted successfully' });
  } catch (error) {
    console.error('Error deleting slide:', error);
    return Response.json({ error: 'Failed to delete slide' }, { status: 500 });
  }
}