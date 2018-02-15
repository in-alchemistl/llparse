'use strict';

const llparse = require('./');

const assert = require('assert');
const IR = require('llvm-ir');

const TYPE_INPUT = IR.i(8).ptr();
const TYPE_OUTPUT = IR.i(8).ptr();

class Compiler {
  constructor(prefix) {
    this.prefix = prefix;
    this.ir = new IR();
    this.trie = new llparse.Trie();

    this.state = this.ir.struct(`${this.prefix}_state`);
    this.sig = this.ir.signature(TYPE_OUTPUT, [
      this.state.ptr(), TYPE_INPUT, TYPE_INPUT
    ]);

    this.state.field(TYPE_OUTPUT, 'current');
  }

  build(root) {
    // TODO(indutny): init function
    // TODO(indutny): parse function

    this.buildNode(root);

    return this.ir.build();
  }

  buildNode(node) {
    const fn = this.ir.fn(this.sig,
      `${this.prefix}_${node.name}`, [ 's', 'p', 'endp' ]);
    fn.visibility = 'internal fastcc';

    const body = fn.body;

    const trie = this.trie.combine(node.cases);

    const otherwise =
      node.cases.filter(c => c instanceof llparse.case.Otherwise);
    assert.strictEqual(otherwise.length, 1,
      'Node must have only 1 `.otherwise()`');

    body.terminate('ret', [ TYPE_OUTPUT, TYPE_OUTPUT.v(null) ]);
  }
}
module.exports = Compiler;