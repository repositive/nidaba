import irisSetup from '@repositive/iris';
import { IrisAMQP } from '@repositive/iris';
import { inject } from '@repositive/iris';
import * as config from 'config';
import parse from './parse';

const pack = require('../package.json');

export default async function init({
  _config = config,
  _irisSetup = irisSetup,
  _parse = parse,
  _pack = pack
}: {
    _config?: typeof config,
    _irisSetup?: typeof irisSetup,
    _parse?: typeof parse,
    _pack?: { version: string }
  }): Promise<void> {
  const irisOpts = _config.get<any>('iris');

  const _handler = async function ({
    payload,
    _options
   }: {
      payload: any,
      _options: any
    }) {
    console.log('Nidaba:');

    return _parse({ payload: payload.toString(), _options })
      .then(res => {
        if (!Array.isArray(res)) {
          throw new Error('Unexpected Error: Something went wrong in parsing file!');
        }
        console.log(res.length);
        return Buffer.from(JSON.stringify(res));
      })
      .catch(err => {
        console.log(err.message);
        return Buffer.from(`ERROR: ${err.message}`);
      });
  };


  _irisSetup(irisOpts).map(iris => {
    iris.register({
      pattern: `status.${irisOpts.namespace}`, async handler(msg: any) {
        return {
          version: _pack.version
        };
      }
    });

    const irisBackend = iris.backend;


    const csv_handler = inject({ args: { _options: { delimiter: ',', columns: true } }, func: _handler });
    irisBackend.register({ pattern: `action.csv.parse.file`, handler: csv_handler });

    const tsv_handler = inject({ args: { _options: { delimiter: '\t', columns: true } }, func: _handler });
    irisBackend.register({ pattern: `action.tsv.parse.file`, handler: tsv_handler });

    const vcf_handler = inject({ args: { _options: { delimiter: '\t', columns: true, comment: '##' } }, func: _handler });
    irisBackend.register({ pattern: `action.vcf.parse.file`, handler: vcf_handler });

  })
    .subscribe();

}
