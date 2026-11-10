/**
 * dsh-chat-wallpaper — host half.
 *
 * Deliberately empty. Everything this plugin does happens in the browser half
 * (`lib/client.js`), which paints the wallpaper and the glass surfaces in the
 * page itself. The image is embedded in that bundle as a data URL, so the host
 * serves no route and writes no file: a plugin that only decorates the UI has
 * no business touching the web server or the package directory.
 */
export const name = 'dsh-chat-wallpaper'

export function apply() {}
