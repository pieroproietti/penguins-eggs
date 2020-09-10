export function automirror(): string {
   let text = ''
   text += '---\n'
   text += '# Which base URL to use for the archive.\n'
   text += '#\n'
   text += '# This assumes that your mirror URLs are under XX.baseURL\n'
   text += 'baseUrl: archive.ubuntu.com\n'
   text += '\n'
   text += '# URL used for IP address lookup\n'
   text += 'geoip:\n'
   text += 'style: "json"\n'
   text += 'url:   "https://ipapi.co/json"\n'
   text += '\n'
   text += '# Distribution that this is based off of.\n'
   text += '# This is so we can make safe assumptions for the contents of\n'
   text += '# sources.list-like files.\n'
   text += 'distribution: Ubuntu\n'
   return text
}
