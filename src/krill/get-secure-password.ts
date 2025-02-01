// password.ts
import read from 'read'

export async function getSecurePassword(
  prompt: string,
  options: { retries?: number; minLength?: number } = {}
): Promise<string> {
  const { retries = 3, minLength = 12 } = options
  let attempts = 0

  while (attempts < retries) {
    try {
      const password: string = await new Promise((resolve, reject) => {
        read(
          {
            prompt: `${prompt} (tentativo ${attempts + 1}/${retries}):`,
            silent: true,
            replace: '*'
          },
          (err: Error | null, result: string) => {
            if (err) reject(err)
            else resolve(result.trim())
          }
        )
      })

      if (password.length < minLength) {
        throw new Error(`La password deve avere almeno ${minLength} caratteri`)
      }

      // Conferma password
      const confirm: string = await new Promise((resolve, reject) => {
        read(
          { prompt: 'Conferma password:', silent: true, replace: '*' },
          (err: Error | null, result: string) => {
            if (err) reject(err)
            else resolve(result.trim())
          }
        )
      })

      if (password !== confirm) {
        throw new Error('Le password non coincidono')
      }

      return password

    } catch (error) {
      attempts++
      if (attempts >= retries) {
        throw new Error('Troppi tentativi falliti')
      }
      if (error instanceof Error) {
        console.log(`\nErrore: ${error.message}`)
      }
    }
  }

  throw new Error('Impossibile ottenere la password')
}