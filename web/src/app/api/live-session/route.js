import sql from "@/app/api/utils/sql";

// Get current live session
export async function GET() {
  try {
    const [session] = await sql`
      SELECT ls.*, 
             p.title as presentation_title,
             s.title as slide_title,
             s.content as slide_content,
             s.slide_type,
             s.background_color,
             s.text_color,
             s.font_size,
             s.notes,
             cs.name as camera_name
      FROM live_sessions ls
      LEFT JOIN presentations p ON ls.presentation_id = p.id
      LEFT JOIN slides s ON ls.current_slide_id = s.id
      LEFT JOIN camera_sources cs ON ls.camera_source_id = cs.id
      WHERE ls.is_live = true
      ORDER BY ls.updated_at DESC
      LIMIT 1
    `;

    return Response.json({ session });
  } catch (error) {
    console.error("Error fetching live session:", error);
    return Response.json(
      { error: "Failed to fetch live session" },
      { status: 500 },
    );
  }
}

// Start or update live session
export async function POST(request) {
  try {
    const {
      presentation_id,
      current_slide_id,
      camera_source_id,
      show_camera = false,
    } = await request.json();

    // End any existing live sessions
    await sql`
      UPDATE live_sessions SET is_live = false
      WHERE is_live = true
    `;

    // Create new live session
    const [session] = await sql`
      INSERT INTO live_sessions (
        presentation_id, current_slide_id, camera_source_id, 
        show_camera, is_live
      )
      VALUES (
        ${presentation_id}, ${current_slide_id}, ${camera_source_id},
        ${show_camera}, true
      )
      RETURNING *
    `;

    return Response.json({ session });
  } catch (error) {
    console.error("Error creating live session:", error);
    return Response.json(
      { error: "Failed to create live session" },
      { status: 500 },
    );
  }
}

// Update live session
export async function PUT(request) {
  try {
    const updateData = await request.json();

    const allowedFields = [
      "current_slide_id",
      "camera_source_id",
      "show_camera",
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
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");

    const query = `
      UPDATE live_sessions 
      SET ${updates.join(", ")}
      WHERE is_live = true
      RETURNING *
    `;

    const [session] = await sql(query, values);

    if (!session) {
      return Response.json(
        { error: "No active live session found" },
        { status: 404 },
      );
    }

    return Response.json({ session });
  } catch (error) {
    console.error("Error updating live session:", error);
    return Response.json(
      { error: "Failed to update live session" },
      { status: 500 },
    );
  }
}
