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

import { useState } from 'react';
import {
  Dialog,
  type TreeNodeContainerProps,
  type TreeData,
  type TreeNodeData,
  ResizablePanelGroup,
  ResizablePanelSplitter,
  ResizablePanel,
  ResizablePanelSplitterLine,
  clsx,
  TreeView,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@finos/legend-art';
import { addUniqueEntry, isNonNullable } from '@finos/legend-shared';
import type { ExecutionPlanState } from '../../../../../stores/ExecutionPlanState';
import { observer } from 'mobx-react-lite';
import { ExecutionNodesViewer } from './ExecutionNodesViewer';
import { EDITOR_LANGUAGE, TAB_SIZE } from '@finos/legend-application';
import {
  type ExecutionPlan,
  ExecutionNode,
  SQLExecutionNode,
  RelationalTDSInstantiationExecutionNode,
} from '@finos/legend-graph';
import { StudioTextInputEditor } from '../../../../shared/StudioTextInputEditor';

export class ExecutionPlanViewTreeNodeData implements TreeNodeData {
  id: string;
  label: string;
  isSelected?: boolean;
  isOpen?: boolean;
  childrenIds?: string[];
  executionPlan!: ExecutionPlan;

  constructor(id: string, label: string, executionPlan: ExecutionPlan) {
    this.id = id;
    this.label = label;
    this.executionPlan = executionPlan;
  }
}

export class ExecutionNodeTreeNodeData implements TreeNodeData {
  id: string;
  label: string;
  isSelected?: boolean;
  isOpen?: boolean;
  childrenIds?: string[];
  executionNode: ExecutionNode;

  constructor(id: string, label: string, executionNode: ExecutionNode) {
    this.id = id;
    this.label = label;
    this.executionNode = executionNode;
  }
}
export class ExecutionNodesTreeNodeData implements TreeNodeData {
  id: string;
  label: string;
  isSelected?: boolean;
  isOpen?: boolean;
  childrenIds?: string[];
  executionNodes: ExecutionNode[];

  constructor(id: string, label: string, executionNodes: ExecutionNode[]) {
    this.id = id;
    this.label = label;
    this.executionNodes = executionNodes;
  }
}

const generateExecutionNodeTypeLabel = (type: ExecutionNode): string => {
  if (type instanceof SQLExecutionNode) {
    return `SQL Execution Node`;
  } else if (type instanceof RelationalTDSInstantiationExecutionNode) {
    return `Relational TDS Instantiation Execution Node`;
  } else {
    return 'Other';
  }
};

const generateExecutionNodeTreeNodeId = (
  executionNode: ExecutionNode,
  parentNode:
    | ExecutionNodeTreeNodeData
    | ExecutionPlanViewTreeNodeData
    | undefined,
): string => {
  if (executionNode instanceof SQLExecutionNode) {
    return `SQL::${parentNode?.id ?? ``}`;
  } else if (executionNode instanceof RelationalTDSInstantiationExecutionNode) {
    return `RELTDS::${parentNode?.id ?? ``}`;
  }
  return `EXEC::${parentNode?.id ?? ``}`;
};

const generateExecutionNodeTreeNodeData = (
  executionNode: ExecutionNode,
  label: string,
  parentNode:
    | ExecutionNodeTreeNodeData
    | ExecutionPlanViewTreeNodeData
    | undefined,
): ExecutionNodeTreeNodeData => {
  const executionNodeTreeNode = new ExecutionNodeTreeNodeData(
    generateExecutionNodeTreeNodeId(executionNode, parentNode),
    label,
    executionNode,
  );

  const childrenIds: string[] = [];

  executionNode.executionNodes
    .slice()
    .filter((exen): exen is ExecutionNode => exen instanceof ExecutionNode)
    .forEach((exen) => {
      addUniqueEntry(
        childrenIds,
        generateExecutionNodeTreeNodeId(exen, executionNodeTreeNode),
      );
    });

  executionNodeTreeNode.childrenIds = childrenIds;

  return executionNodeTreeNode;
};

const generateExecutionPlanTreeNodeData = (
  executionPlan: ExecutionPlan,
): ExecutionPlanViewTreeNodeData => {
  const executionPlanNode = new ExecutionPlanViewTreeNodeData(
    `Execution Plan`,
    `Execution Plan`,
    executionPlan,
  );

  const childrenIds: string[] = [];

  const rootNodeId = generateExecutionNodeTreeNodeId(
    executionPlan.rootExecutionNode,
    executionPlanNode,
  );
  addUniqueEntry(childrenIds, rootNodeId);
  executionPlanNode.childrenIds = childrenIds;
  return executionPlanNode;
};

const getExecutionPlanTreeData = (
  executionPlan: ExecutionPlan,
): TreeData<ExecutionPlanViewTreeNodeData | ExecutionNodeTreeNodeData> => {
  const rootIds: string[] = [];
  const nodes = new Map<
    string,
    ExecutionPlanViewTreeNodeData | ExecutionNodeTreeNodeData
  >();
  const executionPlanTreeNode =
    generateExecutionPlanTreeNodeData(executionPlan);
  addUniqueEntry(rootIds, executionPlanTreeNode.id);
  nodes.set(executionPlanTreeNode.id, executionPlanTreeNode);
  return { rootIds, nodes };
};

const ExecutionNodeElementTreeNodeContainer: React.FC<
  TreeNodeContainerProps<
    ExecutionPlanViewTreeNodeData | ExecutionNodeTreeNodeData,
    {
      onNodeExpand: (
        node: ExecutionPlanViewTreeNodeData | ExecutionNodeTreeNodeData,
      ) => void;
    }
  >
> = (props) => {
  const { node, level, stepPaddingInRem, onNodeSelect, innerProps } = props;
  const { onNodeExpand } = innerProps;
  const isExpandable = Boolean(node.childrenIds?.length);
  const selectNode = (): void => onNodeSelect?.(node);
  const expandNode = (): void => onNodeExpand(node);
  const nodeExpandIcon = isExpandable ? (
    node.isOpen ? (
      <ChevronDownIcon />
    ) : (
      <ChevronRightIcon />
    )
  ) : (
    <div />
  );

  return (
    <div
      className={clsx(
        'tree-view__node__container explorer__package-tree__node__container',
        {
          'menu__trigger--on-menu-open': !node.isSelected,
        },
        {
          'explorer__package-tree__node__container--selected': node.isSelected,
        },
      )}
      style={{
        paddingLeft: `${(level - 1) * (stepPaddingInRem ?? 1)}rem`,
        paddingTop: `0.1rem`,
        display: 'flex',
      }}
    >
      <div className="tree-view__node__icon flat-data-column-tree__node__icon">
        <div className="type-tree__expand-icon" onClick={expandNode}>
          {nodeExpandIcon}
        </div>
      </div>

      <button
        onClick={selectNode}
        className="tree-view__node__label explorer__package-tree__node__label"
        tabIndex={-1}
        title={`${node.id}`}
      >
        {node.label}
      </button>
    </div>
  );
};

export const ExecutionPlanTree: React.FC<{
  executionPlanState: ExecutionPlanState;
  executionPlan: ExecutionPlan;
}> = (props) => {
  const { executionPlanState, executionPlan } = props;
  // NOTE: We only need to compute this once so we use lazy initial state syntax
  // See https://reactjs.org/docs/hooks-reference.html#lazy-initial-state
  const [treeData, setTreeData] = useState<
    TreeData<ExecutionPlanViewTreeNodeData | ExecutionNodeTreeNodeData>
  >(() => getExecutionPlanTreeData(executionPlan));
  const onNodeSelect = (
    node: ExecutionPlanViewTreeNodeData | ExecutionNodeTreeNodeData,
  ): void => {
    if (node instanceof ExecutionPlanViewTreeNodeData) {
      executionPlanState.transformMetaDataToProtocolJson(node.executionPlan);
    } else if (node instanceof ExecutionNodeTreeNodeData) {
      executionPlanState.transformMetaDataToProtocolJson(node.executionNode);
    }
    executionPlanState.setSelectedNode(node);
  };

  const onNodeExpand = (
    node: ExecutionPlanViewTreeNodeData | ExecutionNodeTreeNodeData,
  ): void => {
    if (node.childrenIds?.length) {
      node.isOpen = !node.isOpen;
      if (node instanceof ExecutionPlanViewTreeNodeData) {
        const rootNode = node.executionPlan.rootExecutionNode;
        const rootNodeTreeNode = generateExecutionNodeTreeNodeData(
          rootNode,
          generateExecutionNodeTypeLabel(rootNode),
          node,
        );

        treeData.nodes.set(rootNodeTreeNode.id, rootNodeTreeNode);
      } else if (node instanceof ExecutionNodeTreeNodeData) {
        if (node.executionNode.executionNodes.length > 0) {
          node.executionNode.executionNodes.forEach((exen) => {
            const executionNodeTreeNode = generateExecutionNodeTreeNodeData(
              exen,
              generateExecutionNodeTypeLabel(exen),
              node,
            );

            treeData.nodes.set(executionNodeTreeNode.id, executionNodeTreeNode);
          });
        }
      }
    }

    setTreeData({ ...treeData });
  };

  const getChildNodes = (
    node: ExecutionPlanViewTreeNodeData | ExecutionNodeTreeNodeData,
  ): (ExecutionPlanViewTreeNodeData | ExecutionNodeTreeNodeData)[] => {
    if (!node.childrenIds || node.childrenIds.length === 0) {
      return [];
    }
    const childrenNodes = node.childrenIds
      .map((id) => treeData.nodes.get(id))
      .filter(isNonNullable);

    return childrenNodes;
  };
  return (
    <TreeView
      components={{
        TreeNodeContainer: ExecutionNodeElementTreeNodeContainer,
      }}
      treeData={treeData}
      getChildNodes={getChildNodes}
      onNodeSelect={onNodeSelect}
      innerProps={{
        onNodeExpand,
      }}
    />
  );
};

export const ExecutionPlanViewer = observer(
  (props: { executionPlanState: ExecutionPlanState }) => {
    const { executionPlanState } = props;
    const closePlanViewer = (): void => {
      executionPlanState.setRawPlan(undefined);
      executionPlanState.setPlan(undefined);
      executionPlanState.setExecutionPlanDisplayData('');
      executionPlanState.setSelectedNode(undefined);
    };
    const rawPlan = executionPlanState.rawPlan;
    const plan = executionPlanState.plan;
    if (!rawPlan) {
      return null;
    }
    return (
      <Dialog
        open={Boolean(executionPlanState.rawPlan)}
        onClose={closePlanViewer}
        classes={{
          root: 'editor-modal__root-container',
          container: 'editor-modal__container',
          paper: 'editor-modal__content',
        }}
        TransitionProps={{
          appear: false, // disable transition
        }}
      >
        <div className="modal modal--dark editor-modal">
          <div className="modal__header">
            <div className="modal__title">Execution Plan</div>
          </div>
          {plan ? (
            <div className="modal__body">
              <ResizablePanelGroup orientation="vertical">
                <ResizablePanel size={350} minSize={350}>
                  <div className="panel explorer">
                    <div className="panel__header side-bar__header">
                      <div className="panel__header__title">
                        <div className="panel__header__title__content side-bar__header__title__content">
                          EXECUTION PLAN EXPLORER
                        </div>
                      </div>
                    </div>
                    <div className="panel__content explorer__content__container">
                      <ExecutionPlanTree
                        executionPlanState={executionPlanState}
                        executionPlan={plan}
                      />
                    </div>
                  </div>
                </ResizablePanel>
                <ResizablePanelSplitter>
                  <ResizablePanelSplitterLine color="var(--color-dark-grey-200)" />
                </ResizablePanelSplitter>
                <ResizablePanel>
                  <ExecutionNodesViewer
                    displayData={executionPlanState.displayData}
                    executionPlanState={executionPlanState}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          ) : (
            <div className="modal__body">
              <StudioTextInputEditor
                inputValue={JSON.stringify(rawPlan, undefined, TAB_SIZE)}
                isReadOnly={true}
                language={EDITOR_LANGUAGE.JSON}
                showMiniMap={true}
              />
            </div>
          )}
          <div className="modal__footer">
            <button
              className="btn modal__footer__close-btn"
              onClick={closePlanViewer}
            >
              Close
            </button>
          </div>
        </div>
      </Dialog>
    );
  },
);
