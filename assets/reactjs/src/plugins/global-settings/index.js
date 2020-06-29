import './style.scss';
import Color from './components';
import classnames from 'classnames';
import icons from '../../helpers/icons';
import {
    getGlobalSettings as getGlobalCSS,
    injectGlobalCSS,
    updateGlobalVaribales,
    setTypoTitleStyle
} from '../../helpers/globalCSS';


/**
 * Qubely Components
 */
import Typography from '../../components/fields/Typography';
import {
    ADDNEWDEFAULT,
    DEFAULTPRESETS,
    DEFAULTBREAKINGPOINTS
} from './constants';

/**
 * WordPress dependencies
 */

const { __ } = wp.i18n;
const diff = require("deep-object-diff").diff;
const {
    Component,
    Fragment,
    createRef
} = wp.element;

const {
    Tooltip,
    Dropdown,
    PanelBody,
    Notice,
    RangeControl
} = wp.components;

const {
    select
} = wp.data;

const {
    PluginSidebar,
    PluginSidebarMoreMenuItem
} = wp.editPost;



const PATH = '/qubely/v1/global_settings';

async function fetchFromApi() {
    return await wp.apiFetch({ path: PATH })
}


class GlobalSettings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            presets: {},
            ...DEFAULTPRESETS,
            newTypoScope: 'others',
            newTypoTitle: null,
            activePreset: null,
            renameTypo: undefined,
            enableRenaming: undefined,
            showTypoSettings: undefined,
            showPresetSettings: undefined,
            breakingPoints: {
                xs: 540,
                sm: 720,
                md: 960,
                lg: 1100
            }
        }
        this.ref = createRef();
        this.typoRef = createRef();
        // this.saveGlobalCSS = this.saveGlobalCSS.bind(this);
    }

    async componentDidMount() {
        await this.getGlobalSettings();
        // await this.saveGlobalCSS();
        await this.updateGlobalSettings()
    }

    // async saveGlobalCSS() {
    //     let _CSS = await getGlobalCSS();
    //     await injectGlobalCSS(_CSS, 'qubely-global-styles');
    // }

    async componentDidUpdate(prevProps, prevState) {
        const {
            presets,
            activePreset,
            renameTypo,
            enableRenaming,
            breakingPoints
        } = this.state;

        if ((enableRenaming !== prevState.enableRenaming) && typeof enableRenaming !== 'undefined') {
            setTimeout(() => {
                if (typeof this.ref.current !== 'undefined') {
                    this.ref.current.focus();
                }
            }, 100);
        }
        if ((renameTypo !== prevState.renameTypo) && typeof renameTypo !== 'undefined') {
            setTimeout(() => {
                if (typeof this.ref.current !== 'undefined') {
                    this.typoRef.current.focus();
                }
            }, 100);
        }

        if (presets && activePreset) {
            if (activePreset !== prevState.activePreset) {
                updateGlobalVaribales(presets[activePreset], breakingPoints);
            }
        }

        if (activePreset !== prevState.activePreset ||
            // Object.keys(diff({ 'activePreset': presets[activePreset].colors }, { 'activePreset': prevState.presets[prevStateactivePreset].colors })).length > 0 ||
            Object.keys(diff({ 'breakingPoints': breakingPoints }, { 'breakingPoints': prevState.breakingPoints })).length > 0) {
            /**
            * to activate Update button
            */
            wp.data.dispatch('core/editor').editPost({ meta: { _non_existing_meta: true } });
        }

    }


    getGlobalSettings = () => {
        return fetchFromApi().then(data => {
            if (data.success) {
                this.setState({ ...data.settings });
                localStorage.setItem('qubely-global-settings', JSON.stringify({ ...DEFAULTPRESETS, ...data.settings }))
            }
        });
    }

    updateGlobalSettings = async () => {
        const {
            presets,
            activePreset,
            breakingPoints
        } = this.state;
        let tempData = {
            activePreset,
            presets: {
                ...presets
            },
            breakingPoints: {
                ...breakingPoints
            }
        }
        await wp.apiFetch({
            path: PATH,
            method: 'POST',
            data: { settings: JSON.stringify(tempData) }
        }).then(data => {
            return data;
        })
    }

    render() {
        const {
            presets,
            breakingPoints,
            renameTypo,
            newTypoScope,
            newTypoTitle,
            activePreset,
            enableRenaming,
            showTypoSettings,
            showPresetSettings
        } = this.state;

        const changeColor = (key, newValue, presetKey) => {
            this.setState(({ presets, activePreset, breakingPoints }, props) => {
                let tempPresets = presets;
                tempPresets[presetKey].colors[key] = newValue;
                updateGlobalVaribales(tempPresets[activePreset], breakingPoints);
                return { presets: tempPresets };
            });
        }
        const addNewColor = (presetKey) => {
            this.setState(({ presets }, props) => {
                let tempPresets = presets;
                tempPresets[presetKey].colors.push('');
                return { presets: tempPresets };
            });
        }

        const deleteColor = (index, presetKey) => {
            this.setState(({ presets }, props) => {
                let tempPresets = presets;
                tempPresets[presetKey].colors.splice(index, 1);
                return { presets: tempPresets };
            });
        }

        const updateTypography = (addnew = false, presetKey, index, newValue) => {

            this.setState(({ newTypoScope, newTypoTitle, presets, activePreset, breakingPoints }) => {
                let tempPresets = presets;
                if (addnew) {
                    tempPresets[presetKey].typography.push({
                        name: newTypoTitle ? newTypoTitle : 'Custom Typo',
                        removable: true,
                        scope: newTypoScope,
                        value: {
                            openTypography: 1,
                        }
                    });
                } else if (newValue === 'delete') {
                    tempPresets[presetKey].typography.splice(index, 1);
                } else {
                    tempPresets[presetKey].typography[index].value = newValue;
                }

                updateGlobalVaribales(tempPresets[activePreset], breakingPoints);
                return ({
                    presets: tempPresets,
                    newTypoTitle: null,
                    // showTypoSettings: undefined
                });
            });
        }
        const renameTypography = (presetKey, index, newValue) => {

            this.setState(({ presets, activePreset, breakingPoints }) => {
                let tempPresets = presets;
                tempPresets[presetKey].typography[index].name = newValue
                updateGlobalVaribales(tempPresets[activePreset], breakingPoints);
                return ({
                    presets: tempPresets
                });
            });
        }
        const addNewPreset = (selectedPreset, operation) => {
            this.setState(async (prevState) => {
                let tempPreset, numOfPresets = Object.keys(presets).length;
                if (operation === 'add') {
                    tempPreset = selectedPreset;
                } else {
                    tempPreset = JSON.parse(JSON.stringify(prevState.presets[selectedPreset]));
                }

                const newPresetName = `preset${numOfPresets + 1}`;
                prevState.presets[newPresetName] = tempPreset;
                prevState.presets[newPresetName].key = newPresetName;

                if (operation === 'duplicate') {
                    prevState.presets[newPresetName].name = `Copy of ${tempPreset.name}`;
                } else {
                    prevState.presets[newPresetName].name = `Preset #${numOfPresets + 1}`;
                }

                if (operation === 'saveAs') {
                    await fetchFromApi().then(data => {
                        if (data.success) {
                            if (typeof data.settings.presets[selectedPreset] !== 'undefined') {
                                prevState.presets[selectedPreset] = data.settings.presets[selectedPreset];
                            }
                        }
                    });
                    return ({
                        presets: prevState.presets,
                        showPresetSettings: undefined
                    });
                }

                return ({
                    presets: prevState.presets
                });
            })

        }
        const renderPresets = () => {

            const AddNewButton = (message, hint, classes, action = undefined) => {
                return (
                    <Tooltip text={__(hint)}>
                        <div
                            className={classes}
                            onClick={action}
                            {...((typeof action !== 'undefined') && {
                                onClick: () => action()
                            }
                            )}
                        >
                            <div className="add-new">
                                <span className="icon">
                                    {icons.plus_circle}
                                </span>
                                <span className="title">{__(message)}</span>
                            </div>
                        </div>
                    </Tooltip >
                );
            };

            const deletePreset = (selectedPreset) => {
                this.setState(prevState => {
                    delete prevState.presets[selectedPreset];
                    localStorage.setItem('qubely-global-settings', JSON.stringify(presets[selectedPreset === prevState.activePreset ? 'preset1' : activePreset]));
                    return ({
                        presets: prevState.presets,
                        ...((selectedPreset === prevState.activePreset) && { activePreset: 'preset1' })
                    })
                });
            }

            const renameTitle = (newTitle = '', presetKey) => {
                this.setState(prevState => {
                    prevState.presets[presetKey].name = newTitle;
                    return ({
                        presets: prevState.presets,
                    });
                });
            }
            const themeSupports = wp.data.select('core').getThemeSupports();
            let ThemeSupportCheck = false;
            let themeColorPalette = [], themefontSizes = [];

            if ((typeof themeSupports['editor-color-palette'] === 'object' && themeSupports['editor-color-palette'].length > 0) ||
                (typeof themeSupports['editor-font-sizes'] === 'object' && themeSupports['editor-font-sizes'].length > 0)
            ) {
                ThemeSupportCheck = true;
                themeColorPalette = themeSupports['editor-color-palette'].map(({ color }) => color);
                themefontSizes = themeSupports['editor-font-sizes'].map(({ name, size }) => (
                    {
                        name,
                        scope: "others",
                        value: {
                            openTypography: true,
                            size: {
                                md: size,
                                unit: 'px'
                            }
                        }
                    }));

                themefontSizes.reverse();

                if (typeof presets.theme === 'undefined' ||
                    Object.keys(diff({ 'colors': themeColorPalette }, { 'colors': presets.theme.colors })).length > 0 ||
                    Object.keys(diff({ 'typography': themefontSizes }, { 'typography': presets.theme.typography })).length > 0) {
                    this.setState(({ presets, activePreset, breakingPoints }) => {
                        let tempPresets = presets;
                        delete presets.theme;
                        tempPresets = {
                            theme: {
                                name: 'Theme',
                                key: 'theme',
                                colors: themeColorPalette,
                                typography: themefontSizes
                            },
                            ...presets,
                        }
                        if (activePreset === 'theme') {
                            updateGlobalVaribales(tempPresets[activePreset], breakingPoints);
                        }
                        return ({
                            presets: tempPresets
                        });
                    });
                }
            } else {
                if (presets.theme) {
                    deletePreset('theme');
                }
            }

            return (
                <div className="qubely-global-settings" >
                    {
                        Object.keys(presets).map((presetKey, index) => {
                            const {
                                name,
                                key,
                                colors,
                                typography
                            } = presets[presetKey];

                            let isActivePreset = false, showDetailedSettings = false;

                            if (activePreset === key) {
                                isActivePreset = true;
                            }
                            const changePreset = (index) => {
                                this.setState({
                                    showTypoSettings: undefined,
                                    activePreset: isActivePreset ? undefined : index
                                });
                            }
                            if (showPresetSettings === index) {
                                showDetailedSettings = true;
                            }

                            const classes = classnames(
                                'preset',
                                { ['active']: isActivePreset },
                                { ['detailed']: showDetailedSettings },
                                { ['renaming']: enableRenaming === presetKey }
                            )

                            return (
                                <div key={presetKey} className={classes}>
                                    <div className="title-wrapper">
                                        <div
                                            className="title"
                                            {...(!showDetailedSettings && {
                                                onClick: () => this.setState(state => ({
                                                    showPresetSettings: showDetailedSettings ? undefined : index,
                                                    enableRenaming: enableRenaming !== presetKey ? undefined : presetKey
                                                }))
                                            })}

                                        >
                                            {
                                                showDetailedSettings && (
                                                    <span className="radio-button fas fa-angle-left"
                                                        onClick={() => this.setState(state => ({
                                                            showPresetSettings: showDetailedSettings ? undefined : index,
                                                            ...((enableRenaming === presetKey) && { enableRenaming: undefined })
                                                        }))}
                                                    />
                                                )
                                            }
                                            {
                                                (enableRenaming === presetKey) ? (
                                                    <input
                                                        ref={this.ref}
                                                        value={name}
                                                        type="text"
                                                        className={'rename-preset'}
                                                        placeholder={__('Add preset name')}
                                                        onFocus={() => {
                                                            this.ref.current.value = this.ref.current.value
                                                        }}
                                                        onKeyPress={event => {
                                                            if (event.key == 'Enter') {
                                                                this.ref.current.blur();
                                                                this.setState({
                                                                    enableRenaming: undefined
                                                                })
                                                            }
                                                        }
                                                        }
                                                        onChange={event => renameTitle(event.target.value, presetKey)}
                                                    />
                                                ) : (
                                                        <Fragment>
                                                            <span className="name"> {name}</span>
                                                            {isActivePreset && <span className={'is-active-label'}>{__('Active')}</span>}
                                                        </Fragment>
                                                    )


                                            }
                                        </div>
                                        <Dropdown
                                            position="bottom center"
                                            className="options"
                                            contentClassName="global-settings preset-options"
                                            renderToggle={({ isOpen, onToggle }) => (
                                                showDetailedSettings ?
                                                    <div className="icon" onClick={onToggle}>{icons.ellipsis_h} </div>
                                                    :
                                                    <div className="icon" onClick={onToggle}>{icons.ellipsis_v} </div>
                                            )}
                                            renderContent={({ onToggle }) => {
                                                let activeClass = classnames(
                                                    { ['active']: isActivePreset }
                                                )
                                                return (
                                                    <div className="global-preset-options">
                                                        <div className={activeClass} {...(!isActivePreset && { onClick: () => { changePreset(key); onToggle() } })} >Activate</div>
                                                        {
                                                            showDetailedSettings ?
                                                                <div onClick={() => { addNewPreset(presetKey, 'saveAs'), onToggle() }}>Save as New</div>
                                                                :
                                                                <Fragment>
                                                                    <div
                                                                        onClick={() => {
                                                                            this.setState({
                                                                                enableRenaming: presetKey
                                                                            });
                                                                            onToggle();
                                                                        }}
                                                                    >
                                                                        Rename
                                                                    </div>
                                                                    <div onClick={() => { addNewPreset(presetKey, 'duplicate'); onToggle() }}>Duplicate</div>
                                                                </Fragment>
                                                        }
                                                        {
                                                            index > 1 && <div onClick={() => deletePreset(presetKey)}>Delete</div>
                                                        }
                                                    </div>
                                                )
                                            }}
                                        />


                                    </div>

                                    {
                                        showDetailedSettings &&
                                        <Fragment>

                                            <PanelBody title={__(presetKey === 'theme' ? 'Theme Colors' : 'Global Colors')} initialOpen={true}>
                                                <div className="qubely-global-color-pallete">
                                                    {
                                                        colors.map((value, index) => (
                                                            <Color
                                                                preset={presetKey}
                                                                value={value}
                                                                className={index < 5 ? 'primary-color' : 'added-color'}
                                                                deleteOption={index < 5 ? false : true}
                                                                onDelete={() => deleteColor(index, presetKey)}
                                                                onChange={newValue => changeColor(index, newValue, presetKey)}
                                                            />
                                                        ))
                                                    }
                                                    {
                                                        presetKey === 'theme' && (
                                                            <Notice status="warning" isDismissible={false}>
                                                                Disclaimer: Theme colors aren't editable.
                                                            </Notice>
                                                        )
                                                    }
                                                    {
                                                        presetKey !== 'theme' &&
                                                        <Color
                                                            addNewColor
                                                            value={undefined}
                                                            addNew={() => addNewColor(presetKey)}
                                                            onChange={newValue => changeColor(presets[presetKey].colors.length - 1, newValue, presetKey)}
                                                        />
                                                    }
                                                </div>
                                            </PanelBody>
                                            {
                                                // (typeof typography !== 'undefined' && typography.length > 0) &&
                                                typeof typography !== 'undefined' &&
                                                <PanelBody title={__('Typography')} initialOpen={true}>
                                                    {
                                                        typography.map(({ name, value, scope = 'h', removable = false }, index) => {

                                                            let displaySettings = false;
                                                            if (showTypoSettings === index) {
                                                                displaySettings = true;
                                                            }
                                                            let Tag = `h${index + 1}`;
                                                            if (scope === 'p' || (removable && scope === 'others')) {
                                                                Tag = 'p'
                                                            } else if (scope === 'button') {
                                                                Tag = 'button'
                                                            }
                                                            let wrapperClasses = classnames(
                                                                'qubely-global',
                                                                'typography',
                                                                { ['removable']: removable }
                                                            )
                                                            let titleClasses = classnames(
                                                                'typo-name',
                                                                `tag-${Tag}`,
                                                                `index-${index + 1}`,
                                                                { ['active']: displaySettings }
                                                            )
                                                            return (
                                                                <div className={wrapperClasses}>
                                                                    <div
                                                                        className={titleClasses}
                                                                    >
                                                                        {
                                                                            renameTypo === index ?
                                                                                <input
                                                                                    ref={this.typoRef}
                                                                                    value={name}
                                                                                    type="text"
                                                                                    className={'rename-typo name'}
                                                                                    placeholder={__('Add typography name')}
                                                                                    onFocus={() => {
                                                                                        this.typoRef.current.value = this.typoRef.current.value
                                                                                    }}
                                                                                    onBlur={() => {
                                                                                        this.setState({
                                                                                            renameTypo: undefined
                                                                                        })
                                                                                    }}
                                                                                    onKeyPress={event => {
                                                                                        if (event.key == 'Enter') {
                                                                                            this.typoRef.current.blur();
                                                                                            this.setState({
                                                                                                renameTypo: undefined
                                                                                            })
                                                                                        }
                                                                                    }
                                                                                    }
                                                                                    onChange={event => renameTypography(presetKey, index, event.target.value)}
                                                                                />
                                                                                :
                                                                                <Tag className="name" onClick={() => this.setState({ showTypoSettings: displaySettings ? undefined : index })} > {name}</Tag>
                                                                        }

                                                                        {
                                                                            (displaySettings && removable) &&
                                                                            <Dropdown
                                                                                position="bottom center"
                                                                                className="options"
                                                                                contentClassName="global-settings preset-options"
                                                                                renderToggle={({ isOpen, onToggle }) => (
                                                                                    displaySettings ?
                                                                                        <div className="icon" onClick={onToggle}>{icons.ellipsis_h} </div>
                                                                                        :
                                                                                        <div className="icon" onClick={onToggle}>{icons.ellipsis_v} </div>
                                                                                )}
                                                                                renderContent={({ onToggle }) => {
                                                                                    return (
                                                                                        <div className="global-preset-options">
                                                                                            <div onClick={() => { onToggle(); this.setState({ renameTypo: index }) }}> Rename</div>
                                                                                            <div onClick={() => { updateTypography(false, presetKey, index, 'delete'); onToggle() }} >delete</div>
                                                                                        </div>
                                                                                    )
                                                                                }}
                                                                            />
                                                                        }

                                                                    </div>

                                                                    {displaySettings && (
                                                                        presetKey === 'theme' ?
                                                                            <div className="theme-typo-wrapper">
                                                                                <RangeControl
                                                                                    label={__('Font Size')}
                                                                                    value={value.size.md}
                                                                                    onChange={newValue => console.log("theme default can't be changed")}
                                                                                    disabled
                                                                                />
                                                                                <Notice status="warning" isDismissible={false}>
                                                                                    Disclaimer: Theme fonts aren't editable.
                                                                                </Notice>
                                                                            </div>
                                                                            :
                                                                            <Typography
                                                                                value={value}
                                                                                globalSettings
                                                                                key={name + index}
                                                                                onChange={newValue => updateTypography(false, presetKey, index, newValue)}
                                                                            />
                                                                    )}
                                                                </div>
                                                            )
                                                        })
                                                    }
                                                    {
                                                        (typography.length < 13 && presetKey !== 'theme') && (
                                                            <div onClick={() => updateTypography(true, presetKey)}>
                                                                {AddNewButton('Add new typography', 'Add Typography', "add-new-wrapper add-new-typo")}
                                                            </div>
                                                        )
                                                    }
                                                </PanelBody>
                                            }
                                        </Fragment>
                                    }
                                </div>
                            )
                        })
                    }
                    {AddNewButton('Add new preset', 'Add Preset', "add-new-wrapper", () => addNewPreset(ADDNEWDEFAULT, 'add'))}
                </div >
            )
        }
        const updateBreakingPoints = (key, newValue) => {
            this.setState(({ presets, activePreset, breakingPoints }) => {
                let defaultValue = 540;
                if (key === 'sm') {
                    defaultValue = 720;
                } else if (key === 'md') {
                    defaultValue = 960;
                } else if (key === 'lg') {
                    defaultValue = 1199;
                }
                let newBreakingPoints = {
                    ...breakingPoints,
                    [key]: typeof newValue === 'undefined' ? defaultValue : newValue
                }
                updateGlobalVaribales(presets[activePreset], newBreakingPoints);
                return (
                    {
                        breakingPoints: newBreakingPoints
                    });
            });
        }
        const {
            isSavingPost,
            isPreviewingPost,
            isPublishingPost,
            isAutosavingPost,
        } = select('core/editor');

        if ((isSavingPost() || isPreviewingPost() || isPublishingPost()) && !isAutosavingPost()) {
            this.updateGlobalSettings();
        }

        if (typeof showPresetSettings !== 'undefined') {
            const detailedPreset = Object.keys(presets)[showPresetSettings];
            typeof presets[detailedPreset] !== 'undefined' && setTypoTitleStyle(presets[detailedPreset].typography);
        }
        localStorage.setItem('qubely-global-settings', JSON.stringify(presets[activePreset]));
        return (
            <Fragment>
                <PluginSidebar
                    icon={icons.qubely}
                    name="global-settings-sidebar"
                    title={__('Global Settings')}
                >
                    {renderPresets()}
                    <PanelBody title={__('Row Container width')} initialOpen={false}>
                        <RangeControl
                            min={200}
                            max={700}
                            allowReset
                            label={__('Mobile')}
                            value={breakingPoints.xs}
                            renderTooltipContent={() => value => `${value}%`}
                            onChange={newValue => updateBreakingPoints('xs', newValue)}
                        />
                        <RangeControl
                            min={400}
                            max={1000}
                            allowReset
                            label={__('Tablet')}
                            value={breakingPoints.sm}
                            onChange={newValue => updateBreakingPoints('sm', newValue)}
                        />
                        <RangeControl
                            min={900}
                            max={1920}
                            allowReset
                            label={__('Desktop')}
                            value={breakingPoints.md}
                            onChange={newValue => updateBreakingPoints('md', newValue)}
                        />
                        {/* <RangeControl
                            min={900}
                            max={1199}
                            allowReset
                            label={__('Desktop')}
                            value={breakingPoints.lg}
                            onChange={newValue => updateBreakingPoints('lg', newValue)}
                        /> */}
                        {/* <div className="qubely-row-device">
                            <Notice status="warning" isDismissible={false}>
                                <div className="qubely-device-description title">{__('Device defination in min-width')}</div>
                                <div className="qubely-device-description">{__('Small Mobile : 575px')}</div>
                                <div className="qubely-device-description">  {__('Mobile : 768px')}</div>
                                <div className="qubely-device-description">  {__('Tablet : 991px')}</div>
                                <div className="qubely-device-description">{__('Desktop : 1199px')}</div>
                            </Notice>
                        </div> */}

                    </PanelBody>
                </PluginSidebar>

                <PluginSidebarMoreMenuItem
                    icon={icons.qubely}
                    target="global-settings-sidebar"
                >
                    {__('Global Settings')}
                </PluginSidebarMoreMenuItem>
            </Fragment>
        );
    }
}

export default GlobalSettings;
