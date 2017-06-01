const langs={
    pl: 'Polish.json',
    en: 'English.json',
    es: 'Spanish.json',
    de: 'German.json',
    fr: 'French.json',
    ru: 'Russian.json',
    it: 'Italian.json'
},
host='//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/';


module.exports = function (lang) {
    if (typeof(langs[lang])=='undefined') return host+langs.en;
    return host+langs[lang];
}