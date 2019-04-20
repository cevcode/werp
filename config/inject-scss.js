module.exports = function(source) {
    this.cacheable();
    return `@import "./src/theme/global.scss";

${source}`;
};
