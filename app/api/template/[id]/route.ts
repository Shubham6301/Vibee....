import {
  readTemplateStructureFromJson,
  saveTemplateStructureToJson,
} from "@/modules/playground/lib/path-to-json";
import { db } from "@/lib/db";
import { templatePaths } from "@/lib/template";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { NextRequest, NextResponse } from "next/server";

function validateJsonStructure(data: unknown): boolean {
  try {
    JSON.parse(JSON.stringify(data)); // Ensures it's serializable
    return true;
  } catch (error) {
    console.error("Invalid JSON structure:", error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing playground ID" },
      { status: 400 }
    );
  }

  const playground = await db.playground.findUnique({ where: { id } });

  if (!playground) {
    return NextResponse.json(
      { error: "Playground not found" },
      { status: 404 }
    );
  }

  const templateKey = playground.template as keyof typeof templatePaths;
  const templatePath = templatePaths[templateKey];

  if (!templatePath) {
    return NextResponse.json({ error: "Invalid template" }, { status: 404 });
  }

  try {
    const inputPath = path.join(process.cwd(), templatePath);
    const outputFile = path.join(process.cwd(), `output/${templateKey}.json`);

    // Check if template folder exists
    if (!fsSync.existsSync(inputPath)) {
      console.warn(`Template folder does not exist: ${inputPath}`);
      return NextResponse.json(
        {
          error: "Template folder does not exist",
          templateJson: { folderName: "Root", items: [] },
        },
        { status: 200 }
      );
    }

    // Save structure to JSON
    await saveTemplateStructureToJson(inputPath, outputFile);
    const result = await readTemplateStructureFromJson(outputFile);

    if (!validateJsonStructure(result.items)) {
      return NextResponse.json(
        { error: "Invalid JSON structure" },
        { status: 500 }
      );
    }

    // Cleanup
    await fs.unlink(outputFile);

    return NextResponse.json(
      { success: true, templateJson: result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating template JSON:", error);
    return NextResponse.json(
      {
        error: "Failed to generate template",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
