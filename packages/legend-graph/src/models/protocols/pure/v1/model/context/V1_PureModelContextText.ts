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

import { V1_PureModelContext } from '../../model/context/V1_PureModelContext';
import type { V1_Protocol } from '../../model/V1_Protocol';

export class V1_PureModelContextText extends V1_PureModelContext {
  serializer?: V1_Protocol | undefined;
  code?: string | undefined;
}
