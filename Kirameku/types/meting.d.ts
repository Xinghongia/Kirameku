declare module "@meting/core" {
  export default class Meting {
    constructor(server: string);
    format(flag: boolean): this;
    playlist(id: string): Promise<string>;
    song(id: string): Promise<string>;
    url(id: string, br?: number): Promise<string>;
    pic(id: string, size?: number): Promise<string>;
    lyric(id: string): Promise<string>;
  }
}
