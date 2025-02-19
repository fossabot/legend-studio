/**
 * Copyright (c) 2020-present, Goldman Sachs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createModelSchema, object, optional, primitive } from 'serializr';
import { SerializationFactory, usingModelSchema } from '@finos/legend-shared';
import { V1_ParserError } from '../../engine/grammar/V1_ParserError';
import { V1_LambdaInput } from './V1_LambdaInput';
import { V1_PureModelContextData } from '../../model/context/V1_PureModelContextData';

export enum V1_RenderStyle {
  STANDARD = 'STANDARD',
  PRETTY = 'PRETTY',
  PRETTY_HTML = 'PRETTY_HTML',
}

export class V1_JsonToGrammarInput {
  modelDataContext?: V1_PureModelContextData | undefined;
  isolatedLambdas?: V1_LambdaInput | undefined;
  renderStyle?: V1_RenderStyle | undefined;
  codeError?: V1_ParserError | undefined;

  static readonly serialization = new SerializationFactory(
    createModelSchema(V1_JsonToGrammarInput, {
      modelDataContext: optional(object(V1_PureModelContextData)),
      isolatedLambdas: usingModelSchema(V1_LambdaInput.serialization.schema),
      renderStyle: optional(primitive()),
      codeError: usingModelSchema(V1_ParserError.serialization.schema),
    }),
  );
}
