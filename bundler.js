// node核心模块 获取文件信息
// node bundler.js 用node运行打包工具
const fs = require('fs');
const path = require('path');
// 语法解析工具
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const babel = require('@babel/core');

const moduleAnalyser = (filename) => {
    const content = fs.readFileSync(filename, 'utf-8');
    // ast 抽象语法树 将js代码转换成对象
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

// 依赖图谱
const makeDependenciesGraph = (entry) => {
    const entryModule = moduleAnalyser(entry);
    const graphArray = [ entryModule ];
    for(let i = 0; i < graphArray.length; i++) {
        const item = graphArray[i];
        const { dependencies } = item;
        if ( dependencies ) {
            for (let j in dependencies) {
                graphArray.push(moduleAnalyser(dependencies[j]));
            }
        }
    }
    const graph = {};
    graphArray.forEach(item => {
        graph[item.filename] = {
            dependencies: item.dependencies,
            code: item.code
        }
    });
    return graph;
}

const generateCode = (entry) => {
    const graph = JSON.stringify(makeDependenciesGraph(entry));
    return `
    (function(graph) {
        function require(module) {
            function localRequire(relativePath) {
                return require(graph[module].dependencies[relativePath]);
            }
            var exports = {};
            (function(require, exports, code){
                eval(code);
            })(localRequire, exports, graph[module].code);
            return exports;
        };
        require('${graph}');
    })(${graph});
    `;
};

const code = generateCode('./src/index.js');
console.log(code);

// 依赖图谱
// const graphInfo = makeDependenciesGraph('./src/index.js');
// console.log('graphInfo', graphInfo);

// 首页依赖
// const moduleInfo = moduleAnalyser('./src/index.js');
// console.log('moduleInfo', moduleInfo);