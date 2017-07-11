module.exports = function(data) {

    var last_data=data;
    while(true)
    {
        data=data.replace(/,"([^"]+),([^"]+)",*/g,',$1ZJEBANY_PRZECINEK$2,');
       
        if (last_data==data) break;
        last_data=data;
    }
    
    data=data.replace(/"/g,'').replace(/,/g,'~').replace(/ZJEBANY_PRZECINEK/g,',');
    
    while (data.substr(-1)=='~') data=data.substr(0,data.length-1);
  

    return data;
    
}