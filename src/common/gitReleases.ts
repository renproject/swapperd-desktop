// tslint:disable:no-any

import axios from "axios";

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

// tslint:enable:no-any
