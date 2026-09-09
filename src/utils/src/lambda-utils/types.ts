export type ApimAccessToken = {
  access_token: string;
  token_type: string;
  expires_at: number; // unix timestamp (seconds) at which the token expires
};
