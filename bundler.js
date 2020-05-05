// node核心模块 获取文件信息
// node bundler.js 用node运行打包工具
const fs = require('fs');
const path = require('path');
// 语法解析
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const babel = require('@babel/core');

const moduleAnalyser = (filename) => {
    const content = fs.readFileSync(filename, 'utf-8');
    // ast 抽象语法树
    const ast = parser.parse(content, {
        sourceType: 'module',
    });
    // 对抽象语法树进行遍历 对入口文件依赖关系分析
    const dependencies = {};
    traverse(ast, {
        ImportDeclaration({ node }) {
            const dirname = path.dirname(filename);
            const newFile = './' + path.join(dirname, node.source.value);
            dependencies[node.source.value] = newFile;
        }
    });
    // 将es6语法转换为浏览器能识别运行的语法
    const { code } = babel.transformFromAst(ast, null, {
        presets: ['@babel/preset-env']
    });
    return {
        filename,
        dependencies,
        code,
    };
}

const moduleInfo = moduleAnalyser('./src/index.js');
console.log('moduleInfo', moduleInfo);