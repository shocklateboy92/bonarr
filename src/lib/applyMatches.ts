"use server";

import { promises as fs } from "fs";
import { join, dirname, extname } from "path";

export interface EpisodeMatch {
  episode: {
    episode_number: number;
    season_number: number;
    name: string;
  };
  file: {
    name: string;
    length: number;
  } | null;
  confidence: "high" | "medium" | "low" | "none";
}

export interface ApplyMatchesParams {
  matches: EpisodeMatch[];
  showName: string;
  showId: number;
  seasonNumber: number;
  torrentPath: string;
}

export interface ApplyMatchesResult {
  success: boolean;
  processedCount: number;
  errors: string[];
  details: {
    episode: number;
    sourceFile: string;
    targetFile: string;
    status: "success" | "error";
    error?: string;
  }[];
}

export async function applyMatches(params: ApplyMatchesParams): Promise<ApplyMatchesResult> {
  const { matches, showName, showId, seasonNumber, torrentPath } = params;
  
  const libraryRoot = process.env.VITE_LIBRARY_ROOT;
  if (!libraryRoot) {
    return {
      success: false,
      processedCount: 0,
      errors: ["VITE_LIBRARY_ROOT environment variable is not set"],
      details: []
    };
  }

  const result: ApplyMatchesResult = {
    success: true,
    processedCount: 0,
    errors: [],
    details: []
  };

  // Sanitize show name for filesystem
  const sanitizedShowName = showName.replace(/[<>:"/\\|?*]/g, '-');
  
  // Create show directory structure
  const showDir = join(libraryRoot, `${sanitizedShowName} [tmdbid-${showId}]`);
  const seasonDir = join(showDir, `Season ${seasonNumber.toString().padStart(2, '0')}`);

  try {
    // Ensure directories exist
    await fs.mkdir(seasonDir, { recursive: true });
  } catch (error) {
    const errorMsg = `Failed to create directory structure: ${error}`;
    result.errors.push(errorMsg);
    result.success = false;
    return result;
  }

  // Process each match that has a file
  const matchesToProcess = matches.filter(match => match.file !== null);
  
  for (const match of matchesToProcess) {
    const episode = match.episode;
    const file = match.file!;
    
    const episodeNum = episode.episode_number;
    const sourceFile = join(torrentPath, file.name);
    const fileExt = extname(file.name);
    const targetFileName = `S${seasonNumber.toString().padStart(2, '0')}E${episodeNum.toString().padStart(2, '0')}${fileExt}`;
    const targetFile = join(seasonDir, targetFileName);
    
    const detail: {
      episode: number;
      sourceFile: string;
      targetFile: string;
      status: "success" | "error";
      error?: string;
    } = {
      episode: episodeNum,
      sourceFile,
      targetFile,
      status: "error"
    };

    try {
      // Check if source file exists
      await fs.access(sourceFile);
      
      // Check if target file already exists
      try {
        await fs.access(targetFile);
        detail.error = `Target file already exists: ${targetFile}`;
        result.errors.push(detail.error);
      } catch {
        // Target doesn't exist, we can proceed
        try {
          // Create hard link
          await fs.link(sourceFile, targetFile);
          detail.status = "success";
          result.processedCount++;
        } catch (linkError) {
          detail.error = `Failed to create hard link: ${linkError}`;
          result.errors.push(detail.error);
          result.success = false;
        }
      }
    } catch (accessError) {
      detail.error = `Source file not accessible: ${sourceFile} - ${accessError}`;
      result.errors.push(detail.error);
      result.success = false;
    }
    
    result.details.push(detail);
  }

  // Overall success if we processed at least one file and had no errors
  if (result.processedCount === 0 && matchesToProcess.length > 0) {
    result.success = false;
  }

  return result;
}