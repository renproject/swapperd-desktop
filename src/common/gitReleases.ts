// tslint:disable:no-any

import axios from "axios";
import logger from "electron-log";

const SWAPPERD_RELEASES_URL = "https://api.github.com/repos/renproject/swapperd/releases/latest";

export interface GitAsset {
  url: string;
  id: number;
  node_id: string;
  name: string;
  label: any;
  uploader: any;
  content_type: string;
  state: string;
  size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  browser_download_url: string;
}

export interface GitRelease {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  draft: boolean;
  author: any;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: GitAsset[];
  tarball_url: string;
  zipball_url: string;
  body: string;
}

export async function getLatestRelease(): Promise<GitRelease> {
  const postResponse = await axios({
    method: "GET",
    url: SWAPPERD_RELEASES_URL,
  });
  return postResponse.data as GitRelease;
}

export async function getLatestReleaseVersion(): Promise<string> {
  const release: GitRelease = await getLatestRelease();
  return release.tag_name;
}

export async function getLatestAssets(): Promise<GitAsset[]> {
  const release: GitRelease = await getLatestRelease();
  return release.assets;
}

export function isNewerVersion(currentVersion: string, otherVersion: string): boolean {
  try {
    const cv = splitSemVer(currentVersion);
    const ov = splitSemVer(otherVersion);
    if (ov.major !== cv.major) {
      return ov.major > cv.major;
    }
    if (ov.minor !== cv.minor) {
      return ov.minor > cv.minor;
    }
    if (ov.patch !== cv.patch) {
      return ov.patch > cv.patch;
    }
    return ov.other !== cv.other;
  } catch (err) {
    logger.error(err);
    return false;
  }
}

interface SemVer {
  major: number;
  minor: number;
  patch: number;
  other: string;
}

function splitSemVer(ver: string): SemVer {
  const match = ver.match(/^v?(\d+)\.(\d+)\.(\d+)(.*)$/);
  if (match && match.length === 5) {
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      other: match[4],
    };
  }
  throw new Error(`${ver} is not valid SemVer`);
}

// tslint:enable:no-any
