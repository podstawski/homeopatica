var smekta_debug = false;

module.exports = function(pattern,vars) {
    var now=new Date().getTime();
    
    if (smekta_debug)  console.log(now,'ENTER','len:',pattern.length,'keys:',Object.keys(vars).length);

    for (var key in vars)
    {
        if (vars[key]==null)  vars[key]='';
        
        if (typeof(vars[key])=='object') {
            var re=new RegExp('\\[loop:'+key+'\\](.|[\r\n])+\\[endloop:'+key+'\\]',"g");
            var loop=pattern.match(re);
            if (smekta_debug) console.log(loop);
            if (loop!=null) {
                
                for (var l=0;l<loop.length && l<7;l++)
                {
                    var loopstring=loop[l];
                    var loopcontents=loop[l].substr(7+key.length);
                    loopcontents=loopcontents.substr(0,loopcontents.length-10-key.length);
                    var loopresult='';
                    for (var k=0;k<vars[key].length;k++)
                    {
                        if (smekta_debug) console.log(now,'CALL',key+'.'+k,'len:',loopcontents.length);
                        loopresult+=module.exports(loopcontents,vars[key][k]);
                    }
                    pattern=pattern.replace(loopstring,loopresult);
                }
                
            }
                
        }
    
    }
    
    for (var key in vars)
    {
        
        re=new RegExp('\\[if:'+key+'\\](.|[\r\n])+?\\[endif:'+key+'\\]',"g");
        if (vars[key].length==0 || vars[key]==null || vars[key]=='0') pattern=pattern.replace(re,'');
        
        re=new RegExp('\\[if:!'+key+'\\](.|[\r\n])+?\\[endif:!'+key+'\\]',"g");
        if (vars[key].length>0 || vars[key]) pattern=pattern.replace(re,'');
        
        re=new RegExp('\\['+key+'\\]',"g");
        pattern=pattern.replace(re,vars[key]);
        
        
        pattern=pattern.replace('[if:'+key+']','');
        pattern=pattern.replace('[endif:'+key+']','');
        pattern=pattern.replace('[if:!'+key+']','');
        pattern=pattern.replace('[endif:!'+key+']','');
        
        
                        
    }
    
    
    re=new RegExp('\\[if:([a-z0-9!]+)\\]',"g");
    var ifs=pattern.match(re);
        
    if (ifs!=null) {
        for (var i=0;i<ifs.length; i++) {
        
            key=ifs[i].substr(4,ifs[i].length-5);
            
            if (key.substr(0,1)!='!') {
                re=new RegExp('\\[if:'+key+'\\](.|[\r\n])+?\\[endif:'+key+'\\]',"g");
                pattern=pattern.replace(re,'');
            }                
            pattern=pattern.replace('[if:'+key+']','');
            pattern=pattern.replace('[endif:'+key+']','');

        }
        
    }            
    
    return pattern;
}