import sql from "@/app/api/utils/sql";

// Create new slide
export async function POST(request) {
  try {
    const { 
      presentation_id, 
      title, 
      content, 
      slide_type = 'text',
      background_color = '#000000',
      text_color = '#FFFFFF',
      font_size = 48,
      notes = ''
    } = await request.json();
    
    if (!presentation_id || !content) {
      return Response.json({ error: 'Presentation ID and content are required' }, { status: 400 });
    }
    
    // Get the next position order
    const [maxOrder] = await sql`
      SELECT COALESCE(MAX(position_order), 0) as max_order
      FROM slides WHERE presentation_id = ${presentation_id}
    `;
    
    const position_order = (maxOrder?.max_order || 0) + 1;
    
    const [slide] = await sql`
      INSERT INTO slides (
        presentation_id, title, content, slide_type, 
        background_color, text_color, font_size, 
        position_order, notes
      )
      VALUES (
        ${presentation_id}, ${title}, ${content}, ${slide_type},
        ${background_color}, ${text_color}, ${font_size},
        ${position_order}, ${notes}
      )
      RETURNING *
    `;
    
    return Response.json({ slide });
  } catch (error) {
    console.error('Error creating slide:', error);
    return Response.json({ error: 'Failed to create slide' }, { status: 500 });
  }
}