const CHARS = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': "&quot;",
    '\'': '&#39;',
    '`': '&#96;',
    '=': '&#61;'
};
export default ({
    escapeJava(str){
        if (!str)return str;
        /*

         char[] AMP = "&amp;".toCharArray();
         char[] LT = "&lt;".toCharArray();
         char[] GT = "&gt;".toCharArray();
         char[] DQ = "&quot;".toCharArray();
         char[] SQ = "&#39;".toCharArray();
         char[] BQ = "&#96;".toCharArray();
         char[] EQ = "&#61;".toCharArray();
         */
        const ret =  str.replace(/([<>"'`=&](?!amp;))/g, (m, r) => {
            return  CHARS[r];
        });
        return ret;


        /*                '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#39;')
         .replace(/`/g, '&#96;')
         .replace(/=/g, '&#61;')//EQ
         .replace(/&(?!amp|lt|gt|quot|#39|#96|#61);/g, '&amp;')
         ;*/
    },
    unescapeJava(str){
        return str
    }
})
