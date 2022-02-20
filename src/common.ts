export default abstract class Common {
  public static sanitize(content: string): string {
    return content.replace(/([_*\\|`])/g, '\\$1');
  }
}
