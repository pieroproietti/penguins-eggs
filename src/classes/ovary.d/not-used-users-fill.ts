  /**
   * usersFill
  async usersFill(): Promise<Users[]> {
    if (this.verbose) {
      console.log('Ovary: usersFill')
    }

    const usersArray = []
    await access('/etc/passwd', constants.R_OK | constants.W_OK)
    const passwd = fs.readFileSync('/etc/passwd', 'utf8').split('\n')
    for (const element of passwd) {
      const line = element.split(':')
      const users = new Users(line[0], line[1], line[2], line[3], line[4], line[5], line[6])
      await users.getValues()
      if (users.password !== undefined) {
        usersArray.push(users)
      }
    }

    return usersArray
  }
  */
