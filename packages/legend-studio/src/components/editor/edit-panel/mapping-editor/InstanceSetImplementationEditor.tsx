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

import { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import {
  clsx,
  BlankPanelPlaceholder,
  ResizablePanelGroup,
  ResizablePanel,
  ResizablePanelSplitter,
  AsteriskIcon,
  LongArrowAltDownIcon,
  PencilEditIcon,
} from '@finos/legend-art';
import {
  CORE_DND_TYPE,
  type ElementDragSource,
  type MappingElementSourceDropTarget,
} from '../../../../stores/shared/DnDUtil';
import { LEGEND_STUDIO_TEST_ID } from '../../../LegendStudioTestID';
import {
  InstanceSetImplementationState,
  MappingElementState,
} from '../../../../stores/editor-state/element-editor-state/mapping/MappingElementState';
import {
  type PureInstanceSetImplementationFilterState,
  PureInstanceSetImplementationState,
} from '../../../../stores/editor-state/element-editor-state/mapping/PureInstanceSetImplementationState';
import { guaranteeNonNullable, noop } from '@finos/legend-shared';
import {
  type MappingElementSource,
  getMappingElementSource,
  MappingEditorState,
} from '../../../../stores/editor-state/element-editor-state/mapping/MappingEditorState';
import { TypeTree } from '../../../shared/TypeTree';
import { FlatDataRecordTypeTree } from './FlatDataRecordTypeTree';
import { PropertyMappingsEditor } from './PropertyMappingsEditor';
import { useDrop } from 'react-dnd';
import { FlatDataInstanceSetImplementationState } from '../../../../stores/editor-state/element-editor-state/mapping/FlatDataInstanceSetImplementationState';
import { MappingElementDecorationCleaner } from '../../../../stores/editor-state/element-editor-state/mapping/MappingElementDecorator';
import { UnsupportedInstanceSetImplementationState } from '../../../../stores/editor-state/element-editor-state/mapping/UnsupportedInstanceSetImplementationState';
import { UnsupportedEditorPanel } from '../../../editor/edit-panel/UnsupportedElementEditor';
import { TableOrViewSourceTree } from './relational/TableOrViewSourceTree';
import {
  getSourceElementLabel,
  InstanceSetImplementationSourceSelectorModal,
} from './InstanceSetImplementationSourceSelectorModal';
import { flowResult } from 'mobx';
import { useEditorStore } from '../../EditorStoreProvider';
import {
  ActionAlertActionType,
  useApplicationStore,
} from '@finos/legend-application';
import {
  type InstanceSetImplementation,
  type Property,
  type PackageableElement,
  type View,
  Class,
  Type,
  FlatData,
  RootFlatDataRecordType,
  Table,
  Database,
  PRIMITIVE_TYPE,
  TableAlias,
  TableExplicitReference,
  ViewExplicitReference,
} from '@finos/legend-graph';
import { StudioLambdaEditor } from '../../../shared/StudioLambdaEditor';
import type { EditorStore } from '../../../../stores/EditorStore';

export const InstanceSetImplementationSourceExplorer = observer(
  (props: {
    setImplementation: InstanceSetImplementation;
    isReadOnly: boolean;
  }) => {
    const { setImplementation, isReadOnly } = props;
    const editorStore = useEditorStore();
    const applicationStore = useApplicationStore();
    const mappingEditorState =
      editorStore.getCurrentEditorState(MappingEditorState);
    const instanceSetImplementationState =
      mappingEditorState.currentTabState instanceof MappingElementState
        ? mappingEditorState.currentTabState
        : undefined;
    const srcElement = getMappingElementSource(
      setImplementation,
      editorStore.pluginManager.getStudioPlugins(),
    );
    const sourceLabel = getSourceElementLabel(srcElement);
    // `null` is when we want to open the modal using the existing source
    // `undefined` is to close the source modal
    // any other value to open the source modal using that value as the initial state of the modal
    const [
      sourceElementForSourceSelectorModal,
      setSourceElementForSourceSelectorModal,
    ] = useState<MappingElementSource | undefined | null>();
    const CHANGING_SOURCE_ON_EMBEDDED =
      'Changing source on mapping with embedded children will delete all its children';
    const showSourceSelectorModal = (): void => {
      if (!isReadOnly) {
        const embeddedSetImpls =
          setImplementation.getEmbeddedSetImplmentations();
        if (!embeddedSetImpls.length) {
          setSourceElementForSourceSelectorModal(null);
        } else {
          editorStore.setActionAltertInfo({
            message: CHANGING_SOURCE_ON_EMBEDDED,
            onEnter: (): void => editorStore.setBlockGlobalHotkeys(true),
            onClose: (): void => editorStore.setBlockGlobalHotkeys(false),
            actions: [
              {
                label: 'Continue',
                handler: (): void =>
                  setSourceElementForSourceSelectorModal(null),
                type: ActionAlertActionType.PROCEED,
              },
              {
                label: 'Cancel',
              },
            ],
          });
        }
      }
    };
    const hideSourceSelectorModal = (): void =>
      setSourceElementForSourceSelectorModal(undefined);
    // Drag and Drop
    /* @MARKER: NEW CLASS MAPPING TYPE SUPPORT --- consider adding class mapping type handler here whenever support for a new one is added to the app */
    const dndType = [
      CORE_DND_TYPE.PROJECT_EXPLORER_CLASS,
      CORE_DND_TYPE.PROJECT_EXPLORER_FLAT_DATA,
      CORE_DND_TYPE.PROJECT_EXPLORER_DATABASE,
    ];
    /* @MARKER: NEW CLASS MAPPING TYPE SUPPORT --- consider adding class mapping type handler here whenever support for a new one is added to the app */
    // smartly analyze the content of the source and automatically assign it or its sub-part
    // as class mapping source when possible
    const changeClassMappingSourceDriver = useCallback(
      (droppedPackagableElement: PackageableElement): void => {
        if (droppedPackagableElement instanceof Class) {
          flowResult(
            mappingEditorState.changeClassMappingSourceDriver(
              setImplementation,
              droppedPackagableElement,
            ),
          ).catch(applicationStore.alertIllegalUnhandledError);
        } else if (droppedPackagableElement instanceof FlatData) {
          if (droppedPackagableElement.recordTypes.length === 0) {
            applicationStore.notifyWarning(
              `Source flat-data store '${droppedPackagableElement.path}' must have at least one action`,
            );
            return;
          }
          if (droppedPackagableElement.recordTypes.length === 1) {
            flowResult(
              mappingEditorState.changeClassMappingSourceDriver(
                setImplementation,
                droppedPackagableElement.recordTypes[0],
              ),
            ).catch(applicationStore.alertIllegalUnhandledError);
          } else {
            setSourceElementForSourceSelectorModal(
              droppedPackagableElement.recordTypes[0],
            );
          }
        } else if (droppedPackagableElement instanceof Database) {
          const relations = droppedPackagableElement.schemas.flatMap((schema) =>
            (schema.tables as (Table | View)[]).concat(schema.views),
          );
          if (relations.length === 0) {
            applicationStore.notifyWarning(
              `Source database '${droppedPackagableElement.path}' must have at least one table or view`,
            );
            return;
          }
          const mainTableAlias = new TableAlias();
          mainTableAlias.relation =
            relations[0] instanceof Table
              ? TableExplicitReference.create(relations[0])
              : ViewExplicitReference.create(relations[0] as View);
          mainTableAlias.name = mainTableAlias.relation.value.name;
          if (relations.length === 1) {
            flowResult(
              mappingEditorState.changeClassMappingSourceDriver(
                setImplementation,
                mainTableAlias,
              ),
            ).catch(applicationStore.alertIllegalUnhandledError);
          } else {
            setSourceElementForSourceSelectorModal(mainTableAlias);
          }
        }
      },
      [applicationStore, mappingEditorState, setImplementation],
    );
    const handleDrop = useCallback(
      (item: MappingElementSourceDropTarget): void => {
        if (!setImplementation.isEmbedded && !isReadOnly) {
          const embeddedSetImpls =
            setImplementation.getEmbeddedSetImplmentations();
          const droppedPackagableElement = item.data.packageableElement;
          if (!embeddedSetImpls.length) {
            changeClassMappingSourceDriver(droppedPackagableElement);
          } else {
            editorStore.setActionAltertInfo({
              message: CHANGING_SOURCE_ON_EMBEDDED,
              onEnter: (): void => editorStore.setBlockGlobalHotkeys(true),
              onClose: (): void => editorStore.setBlockGlobalHotkeys(false),
              actions: [
                {
                  label: 'Continue',
                  handler: (): void =>
                    changeClassMappingSourceDriver(droppedPackagableElement),
                  type: ActionAlertActionType.PROCEED,
                },
                {
                  label: 'Cancel',
                },
              ],
            });
          }
        }
      },
      [
        changeClassMappingSourceDriver,
        editorStore,
        isReadOnly,
        setImplementation,
      ],
    );
    const [{ isDragOver, canDrop }, dropRef] = useDrop(
      () => ({
        accept: dndType,
        drop: (item: ElementDragSource): void => handleDrop(item),
        collect: (monitor): { isDragOver: boolean; canDrop: boolean } => ({
          isDragOver: monitor.isOver({ shallow: true }),
          canDrop: monitor.canDrop(),
        }),
      }),
      [handleDrop],
    );
    const isUnsupported =
      instanceSetImplementationState instanceof
      UnsupportedInstanceSetImplementationState;
    if (
      !(
        instanceSetImplementationState instanceof InstanceSetImplementationState
      )
    ) {
      return null;
    }
    return (
      <div
        data-testid={LEGEND_STUDIO_TEST_ID.SOURCE_PANEL}
        className={clsx('panel source-panel', {
          /* @MARKER: NEW CLASS MAPPING TYPE SUPPORT --- consider adding class mapping type handler here whenever support for a new one is added to the app */
          backdrop__element:
            (instanceSetImplementationState instanceof
            PureInstanceSetImplementationState
              ? instanceSetImplementationState.hasParserError
              : false) ||
            (instanceSetImplementationState instanceof
            FlatDataInstanceSetImplementationState
              ? instanceSetImplementationState.hasParserError
              : false),
        })}
      >
        <div className="panel__header">
          <div className="panel__header__title source-panel__header__title">
            <div className="panel__header__title__label">source</div>
            <div className="panel__header__title__content">{sourceLabel}</div>
          </div>
          <div className="panel__header__actions">
            <button
              className="panel__header__action"
              onClick={showSourceSelectorModal}
              disabled={
                isReadOnly || setImplementation.isEmbedded || isUnsupported
              }
              tabIndex={-1}
              title="Select Source..."
            >
              <PencilEditIcon />
            </button>
          </div>
        </div>
        <div ref={dropRef} className="panel__content dnd__dropzone">
          {srcElement && isDragOver && !isReadOnly && (
            <div className="dnd__overlay"></div>
          )}
          {srcElement && (
            <div className="source-panel__explorer">
              {srcElement instanceof Type && (
                <TypeTree
                  type={srcElement}
                  selectedType={instanceSetImplementationState.selectedType}
                />
              )}
              {srcElement instanceof RootFlatDataRecordType && (
                <FlatDataRecordTypeTree
                  recordType={srcElement}
                  selectedType={instanceSetImplementationState.selectedType}
                />
              )}
              {srcElement instanceof TableAlias && (
                <TableOrViewSourceTree
                  relation={srcElement.relation.value}
                  selectedType={instanceSetImplementationState.selectedType}
                />
              )}
            </div>
          )}
          {!srcElement && (
            <BlankPanelPlaceholder
              placeholderText="Choose a source"
              onClick={showSourceSelectorModal}
              clickActionType="add"
              tooltipText="Drop a class mapping source, or click to choose one"
              dndProps={{
                isDragOver: isDragOver && !isReadOnly,
                canDrop: canDrop && !isReadOnly,
              }}
              readOnlyProps={
                !isReadOnly
                  ? undefined
                  : {
                      placeholderText: 'No source',
                    }
              }
            />
          )}
          {isUnsupported && (
            <UnsupportedEditorPanel
              isReadOnly={isReadOnly}
              text={`Can't display class mapping source in form mode`}
            ></UnsupportedEditorPanel>
          )}
          {sourceElementForSourceSelectorModal !== undefined && (
            <InstanceSetImplementationSourceSelectorModal
              mappingEditorState={mappingEditorState}
              setImplementation={setImplementation}
              sourceElementToSelect={sourceElementForSourceSelectorModal}
              closeModal={hideSourceSelectorModal}
            />
          )}
        </div>
      </div>
    );
  },
);

const MappingFilterEditor = observer(
  ({
    editorStore,
    filterState,
    instanceSetImplementationState,
    isReadOnly,
  }: {
    editorStore: EditorStore;
    filterState: PureInstanceSetImplementationFilterState;
    instanceSetImplementationState: PureInstanceSetImplementationState;
    isReadOnly: boolean;
  }) => (
    <div className="panel class-mapping-editor__filter-panel">
      <div className="panel__header">
        <div className="panel__header__title">
          <div className="panel__header__title__content">FILTER</div>
        </div>
      </div>
      <div
        className={clsx('property-mapping-editor', {
          backdrop__element: Boolean(filterState.parserError),
        })}
      >
        <div className="class-mapping-filter-editor__content">
          <StudioLambdaEditor
            className="class-mapping-filter-editor__element__lambda-editor"
            disabled={
              isReadOnly ||
              instanceSetImplementationState.isConvertingTransformLambdaObjects
            }
            forceBackdrop={!!filterState.parserError}
            forceExpansion={false}
            lambdaEditorState={filterState}
            expectedType={editorStore.graphManagerState.graph.getPrimitiveType(
              PRIMITIVE_TYPE.BOOLEAN,
            )}
          />
        </div>
      </div>
    </div>
  ),
);

// Sort by property type/complexity (asc)
const typeSorter = (a: Property, b: Property): number =>
  (a.genericType.value.rawType instanceof Class ? 1 : 0) -
  (b.genericType.value.rawType instanceof Class ? 1 : 0);
// Sort by requiredness/multiplicity (desc)
const requiredStatusSorter = (a: Property, b: Property): number =>
  (a.multiplicity.lowerBound > 0 ? 0 : 1) -
  (b.multiplicity.lowerBound > 0 ? 0 : 1);

export const InstanceSetImplementationEditor = observer(
  (props: {
    setImplementation: InstanceSetImplementation;
    isReadOnly: boolean;
  }) => {
    const { setImplementation, isReadOnly } = props;
    const editorStore = useEditorStore();
    const applicationStore = useApplicationStore();
    const mappingEditorState =
      editorStore.getCurrentEditorState(MappingEditorState);
    const [sortByRequired, setSortByRequired] = useState(true);
    const instanceSetImplementationState = guaranteeNonNullable(
      mappingEditorState.currentTabState instanceof
        InstanceSetImplementationState
        ? mappingEditorState.currentTabState
        : undefined,
      'Mapping element state for instance set implementation must be instance set implementation state',
    );
    const handleSortChange = (): void => setSortByRequired(!sortByRequired);
    // Get properties of supertypes
    const sortedProperties = setImplementation.class.value
      .getAllProperties()
      // LEVEL 1: sort properties by name
      .sort((a, b) => a.name.localeCompare(b.name))
      // LEVEL 2: sort by properties by required/type (which ever is not chosen to be the primary sort)
      .sort(sortByRequired ? typeSorter : requiredStatusSorter)
      // LEVEL 3: sort by properties by required/type (primary sort)
      .sort(sortByRequired ? requiredStatusSorter : typeSorter);

    const isUnsupported =
      instanceSetImplementationState instanceof
      UnsupportedInstanceSetImplementationState;

    const renderFilterEditor =
      instanceSetImplementationState instanceof
        PureInstanceSetImplementationState &&
      instanceSetImplementationState.mappingElement.filter;

    useEffect(() => {
      if (!isReadOnly) {
        instanceSetImplementationState.decorate();
      }
      flowResult(
        instanceSetImplementationState.convertPropertyMappingTransformObjects(),
      ).catch(applicationStore.alertIllegalUnhandledError);
      if (
        instanceSetImplementationState instanceof
          PureInstanceSetImplementationState &&
        instanceSetImplementationState.mappingElement.filter
      ) {
        flowResult(instanceSetImplementationState.convertFilter()).catch(
          applicationStore.alertIllegalUnhandledError,
        );
      }
      return isReadOnly
        ? noop()
        : (): void =>
            setImplementation.accept_SetImplementationVisitor(
              new MappingElementDecorationCleaner(editorStore),
            );
    }, [
      applicationStore,
      setImplementation,
      isReadOnly,
      instanceSetImplementationState,
      editorStore,
    ]);

    useEffect(() => {
      instanceSetImplementationState.setSelectedType(undefined);
    }, [instanceSetImplementationState]);

    return (
      <div className="mapping-element-editor__content">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel minSize={300}>
            <ResizablePanelGroup orientation="horizontal">
              <ResizablePanel minSize={300}>
                <div className="panel class-mapping-editor__property-panel">
                  <div className="panel__header">
                    <div className="panel__header__title">
                      <div className="panel__header__title__content">
                        PROPERTIES
                      </div>
                    </div>
                    <div className="panel__header__actions">
                      <div className="panel__header__action">
                        <div
                          className={`class-mapping-editor__sort-by-required-btn ${
                            sortByRequired
                              ? 'class-mapping-editor__sort-by-required-btn--enabled'
                              : ''
                          }`}
                          onClick={handleSortChange}
                        >
                          <LongArrowAltDownIcon />
                          <AsteriskIcon />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="panel__content">
                    {!isReadOnly &&
                      !isUnsupported &&
                      sortedProperties.map((property) => (
                        <PropertyMappingsEditor
                          key={property.name}
                          property={property}
                          instanceSetImplementationState={
                            instanceSetImplementationState
                          }
                          isReadOnly={isReadOnly}
                        />
                      ))}
                    {isReadOnly &&
                      !isUnsupported &&
                      sortedProperties
                        // for property without any property mapping in readonly mode, we won't show it
                        .filter(
                          (p) =>
                            instanceSetImplementationState.propertyMappingStates.filter(
                              (pm) =>
                                pm.propertyMapping.property.value.name ===
                                p.name,
                            ).length,
                        )
                        .map((property) => (
                          <PropertyMappingsEditor
                            key={property.name}
                            property={property}
                            instanceSetImplementationState={
                              instanceSetImplementationState
                            }
                            isReadOnly={isReadOnly}
                          />
                        ))}
                    {isUnsupported && (
                      <UnsupportedEditorPanel
                        isReadOnly={isReadOnly}
                        text={`Can't display class mapping in form mode`}
                      ></UnsupportedEditorPanel>
                    )}
                  </div>
                </div>
              </ResizablePanel>
              <ResizablePanelSplitter />
              {renderFilterEditor &&
                instanceSetImplementationState.mappingFilterState && (
                  <ResizablePanel size={330} minSize={80}>
                    <MappingFilterEditor
                      editorStore={editorStore}
                      instanceSetImplementationState={
                        instanceSetImplementationState
                      }
                      filterState={
                        instanceSetImplementationState.mappingFilterState
                      }
                      isReadOnly={isReadOnly}
                    />
                  </ResizablePanel>
                )}
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizablePanelSplitter />
          <ResizablePanel size={300} minSize={300}>
            <InstanceSetImplementationSourceExplorer
              setImplementation={setImplementation}
              isReadOnly={isReadOnly}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  },
);
