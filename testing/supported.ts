
import fs from 'fs'

start()

async function start() {
  const supporteds: string[] = []

  const supportedsSource = fs.readFileSync('/etc/locale.gen', 'utf-8').split('\n')
  // Original Format: #en_US.UTF-8 UTF-8
  for (let line of supportedsSource) {
    if (line.slice(0, 2) !== '# ') { // se non è un commento
      line = line.slice(1) // Rimuove #
    }

    supporteds.push(line)
  }

  console.log(supporteds)
}
