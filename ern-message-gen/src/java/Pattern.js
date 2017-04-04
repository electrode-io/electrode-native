const Pattern = {
    CASE_INSENSITIVE: 'i',
    LITERAL: 'q',
    UNICODE_CHARACTER_CLASS: 'u',
    MULTILINE: 'm',
    matches(regex, str){
        return Pattern.compile(regex).matcher(str).find();
    },
    split(regex, str){
        return Pattern.compile(regex).split(str);
    },
    quote(str){
        return (str + '') .replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
    },
    compile(pattern, opts = ""){
        let re = new RegExp(pattern, "g" + opts);

        const p = {
            matcher(str){
                let found;
                return {
                    find(){
                        found = re.exec(str);
                        return found != null;
                    },
                    start(){
                        return found.index;
                    },
                    groupCount(){
                        return found.length
                    },
                    group(idx = 0){
                        return found[idx];
                    },
                    end(){
                        return re.lastIndex;
                    },
                    replaceAll(replaceWith){
                        return str.replace(re, replaceWith);
                    },
                    reset(){
                        found = null;
                        re = new RegExp(pattern, "g" + opts);
                    }
                }
            },
            split(str, count){
                return re[Symbol.split](str, count);
            },
            pattern(){
                return p;
            }
        };
        return p
    }
};
export default Pattern;