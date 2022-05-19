interface AccessToken {
  access_token: string;
  expires_at: number;
}
export default abstract class Common {
  public static _discordAccessToken?: AccessToken;

  public static sanitize(content: string): string {
    return content.replace(/([_*\\|`])/g, '\\$1');
  }

  public static accessTokenValid(): boolean {
    return (Common._discordAccessToken?.expires_at ?? 0) > Date.now();
  }
}
