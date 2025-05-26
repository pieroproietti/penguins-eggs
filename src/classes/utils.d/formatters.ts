/**
 * ./src/classes/utils.d/formatters.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * Formatting utilities - dates, bytes, objects
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

export default class Formatters {
   /**
    * Custom function to sort object keys
    * @param obj 
    * @returns 
    */
   static sortObjectKeys(obj: { [key: string]: any }): { [key: string]: any } {
      const sorted: { [key: string]: any } = {};
      Object.keys(obj)
         .sort()
         .forEach(key => {
            sorted[key] = obj[key];
         });
      return sorted;
   }

   /**
    *
    * @param date
    */
   static formatDate(date: Date) {
      const d = new Date(date)
      let month = String(d.getMonth() + 1)
      let day = String(d.getDate())
      const year = d.getFullYear()
      let hh = String(d.getHours())
      let mm = String(d.getMinutes())
      if (month.length < 2) {
         month = '0' + month
      }
      if (day.length < 2) {
         day = '0' + day
      }
      if (hh.length < 2) {
         hh = '0' + hh
      }
      if (mm.length < 2) {
         mm = '0' + mm
      }
      return [year, month, day].join('-') + '_' + hh + mm
   }

   /**
    *
    * @param bytes
    * @param decimals
    * @returns
    */
   static formatBytes(bytes: number, decimals = 2): string {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
   }
}
