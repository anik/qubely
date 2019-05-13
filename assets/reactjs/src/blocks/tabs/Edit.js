const { __ } = wp.i18n
const { Tooltip, PanelBody, Toolbar } = wp.components;
const { compose } = wp.compose
const { withSelect, withDispatch } = wp.data
const { Component, Fragment } = wp.element;
const { InnerBlocks, RichText, InspectorControls, BlockControls } = wp.editor
import { Color, IconList, Select, Styles, Typography, Range, RadioAdvanced, Wrapper, BoxShadow, Alignment, Tabs, Tab, Separator, Border, Padding, BorderRadius } from "../../components/FieldRender"
import InlineToolbar from '../../components/fields/inline/InlineToolbar'
import '../../components/GlobalSettings'
import { CssGenerator } from '../../components/CssGenerator'
import icons from '../../helpers/icons';

class Edit extends Component {

	constructor(props) {
		super(props)
		this.state = {
			initialRender: true,
			activeTab: 1,
			spacer: true,
			showIconPicker:false,
		}
	}

	componentDidMount() {
		const { setAttributes, clientId, attributes: { uniqueId } } = this.props
		const _client = clientId.substr(0, 6)
		if (!uniqueId) {
			setAttributes({ uniqueId: _client });
		} else if (uniqueId && uniqueId != _client) {
			setAttributes({ uniqueId: _client });
		}
	}

	componentDidUpdate(prevProps, prevState) {
		const { attributes: { tabs }, clientId, block } = this.props

		if (!this.state.initialRender && prevProps.block.innerBlocks.length < block.innerBlocks.length) {
			let currentTabBlock = $(`#block-${clientId}`)
			let activeTab = $(`#block-${block.innerBlocks[tabs - 1].clientId}`, currentTabBlock)
			$('.qubely-active', currentTabBlock).removeClass('qubely-active')
			activeTab.addClass("qubely-active")
		}
	}

	updateTitles = (value, index) => {
		const { attributes: { tabTitles }, setAttributes } = this.props;
		const modifiedTitles = tabTitles.map((title, thisIndex) => {
			if (index === thisIndex) {
				title = { ...title, ...value }
			}
			return title
		})
		setAttributes({ tabTitles: modifiedTitles })
	}

	renderTabTitles = () => {
		const { attributes: { tabTitles, iconPosition }, block, clientId } = this.props
		let currentTabBlock = $(`#block-${clientId}`)
		const {activeTab,showIconPicker}=this.state
		return tabTitles.map((title, index) =>
			<span className={`qubely-tab-item ${(this.state.activeTab == index + 1) ? 'qubely-active' : ''}`}>
				<span class={`qubely-tab-title ${title.iconName ? 'qubely-has-icon-' + iconPosition : ''}`} onClick={() => {
					let activeTab = $(`#block-${block.innerBlocks[index].clientId}`, currentTabBlock)
					$('.qubely-tab-content.qubely-active', currentTabBlock).removeClass('qubely-active')
					activeTab.addClass("qubely-active")
					this.setState({ activeTab: index + 1, initialRender: false ,showIconPicker:!showIconPicker})
				}}
					role="button"
				>
					{title.iconName && (iconPosition == 'top' || iconPosition == 'left') && (<i className={`qubely-tab-icon ${title.iconName}`} />)}
					<RichText
						key="editable"
						keepPlaceholderOnFocus
						placeholder={__('Add Tab Title')}
						value={title.title}
						onChange={value => this.updateTitles({ title: value }, index)}
					/>
					{title.iconName && (iconPosition == 'right') && (<i className={`qubely-tab-icon ${title.iconName}`} />)}
				</span>
				<Tooltip text={__('Delete this tab')}>
					<span className="qubely-action-tab-remove" onClick={() => this.deleteTab(index)} role="button">
						<i class="fas fa-times" />
					</span>
				</Tooltip>
				{( activeTab == index + 1 && showIconPicker) &&
					<Wrapper inline>
						<IconList
							label={__('Icon')}
							value={tabTitles[this.state.activeTab - 1].iconName}
							onChange={(value) => this.updateTitles({ iconName: value }, this.state.activeTab - 1)} />
					</Wrapper>
				}
			</span>
		)
	}

	deleteTab = (tabIndex) => {
		const { activeTab } = this.state
		const { attributes: { tabTitles, tabs }, setAttributes, block, removeBlock, updateBlockAttributes, clientId } = this.props;
		const newItems = tabTitles.filter((item, index) => index != tabIndex)
		setAttributes({ tabTitles: newItems, tabs: tabs - 1 })
		let i = tabIndex + 1
		while (i < tabs) {
			updateBlockAttributes(block.innerBlocks[i].clientId, Object.assign(block.innerBlocks[i].attributes, { id: block.innerBlocks[i].attributes.id - 1 }))
			i++
		}

		removeBlock(block.innerBlocks[tabIndex].clientId)

		if (tabIndex + 1 === activeTab) {
			let currentTabBlock = $(`#block-${clientId}`)
			let nextActiveTab = $(`#block-${block.innerBlocks[tabIndex + 1 < tabs ? tabIndex + 1 : tabs >= 2 ? tabIndex - 1 : tabIndex].clientId}`, currentTabBlock)
			$('.qubely-active', currentTabBlock).removeClass('qubely-active')
			nextActiveTab.addClass("qubely-active")
			this.setState({ activeTab: tabIndex == 0 ? 1 : tabIndex + 1 < tabs ? tabIndex + 1 : tabIndex, initialRender: false })
		}
		tabIndex + 1 < activeTab && this.setState({ activeTab: activeTab - 1, initialRender: false })
	}

	newTitles = () => {
		const { attributes: { tabs, tabTitles } } = this.props
		let newTitles = JSON.parse(JSON.stringify(tabTitles));
		newTitles[tabs] = {
			title: __(`Tab ${tabs + 1}`),
			icon: {},
		}
		return newTitles
	}
	render() {
		const { uniqueId, tabs, tabTitles, tabStyle,
			navSpacing, navSize, navPaddingX, navPaddingY,
			navAlignment,
			typography,
			navColor, navColorActive,
			navBg, navBgActive,
			navBorder, navBorderActive,
			navBorderRadiusTabs,
			navBorderRadiusPills,
			navUnderlineBorderWidth, navUnderlineBorderColor, navUnderlineBorderColorActive,
			iconSize, iconGap, iconPosition,
			bodyBg, bodyPadding, bodyBorder, bodyBorderRadius,
			bodySeparatorHeight, bodySeparatorColor,
			bodyTopSpacing,
			bodyShadow,

		} = this.props.attributes
		const { setAttributes } = this.props
		const { activeTab } = this.state
		if (uniqueId) { CssGenerator(this.props.attributes, 'tabs', uniqueId); }
		let iterator = [], index = 0
		while (index < tabs) {
			iterator.push(index)
			index++
		}

		return (
			<Fragment>
				<InspectorControls key="inspector">
					<PanelBody title={__('Styles')} initialOpen={true}>
						<Styles value={tabStyle} onChange={val => setAttributes({ tabStyle: val })}
							options={[
								{ value: 'tabs', svg: icons.tab_tabs, label: __('Tabs') },
								{ value: 'pills', svg: icons.tab_pills, label: __('Pills') },
								{ value: 'underline', svg: icons.tab_underline, label: __('Underline') },
							]}
						/>
						<Separator />
						<Alignment label={__('Alignment')} value={navAlignment} alignmentType="content" onChange={val => setAttributes({ navAlignment: val })} disableJustify />
					</PanelBody>

					<PanelBody title={__('Nav')} initialOpen={false}>
						<RadioAdvanced label={__('Nav Size')}
							options={[
								{ label: 'S', value: '4px 12px', title: 'Small' },
								{ label: 'M', value: '6px 15px', title: 'Medium' },
								{ label: 'L', value: '10px 20px', title: 'Large' },
								{ icon: 'fas fa-cog', value: 'custom', title: 'Custom' }
							]}
							value={navSize} onChange={(value) => setAttributes({ navSize: value })} />

						{navSize == 'custom' &&
							<Fragment>
								<Range label={<span className="dashicons dashicons-sort" title="X Spacing" />} value={navPaddingY} onChange={(value) => setAttributes({ navPaddingY: value })} unit={['px', 'em', '%']} max={100} min={0} responsive />
								<Range label={<span className="dashicons dashicons-leftright" title="Y Spacing" />} value={navPaddingX} onChange={(value) => setAttributes({ navPaddingX: value })} unit={['px', 'em', '%']} max={100} min={0} responsive />
							</Fragment>
						}

						<Range label={__('Gap')} value={navSpacing} onChange={(value) => setAttributes({ navSpacing: value })} max={50} min={0} unit={['px', 'em', '%']} responsive />

						{tabStyle == 'tabs' &&
							<Fragment>
								<BorderRadius label={__('Radius')} value={navBorderRadiusTabs} onChange={(value) => setAttributes({ navBorderRadiusTabs: value })} min={0} max={100} unit={['px', 'em', '%']} responsive />
							</Fragment>
						}
						{tabStyle == 'pills' &&
							<Fragment>
								<BorderRadius label={__('Radius')} value={navBorderRadiusPills} onChange={(value) => setAttributes({ navBorderRadiusPills: value })} min={0} max={100} unit={['px', 'em', '%']} responsive />
							</Fragment>
						}
						{tabStyle == 'underline' &&
							<Range label={__('Underline Height')} value={navUnderlineBorderWidth} onChange={(value) => setAttributes({ navUnderlineBorderWidth: value })} min={1} max={10} unit={['px', 'em', '%']} responsive />
						}

						<Tabs>
							<Tab tabTitle={__('Normal')}>
								<Color label={__('Color')} value={navColor} onChange={(value) => setAttributes({ navColor: value })} />
								{tabStyle != 'underline' &&
									<Fragment>
										<Color label={__('Background')} value={navBg} onChange={(value) => setAttributes({ navBg: value })} />
										<Border label={__('Border')} value={navBorder} onChange={(value) => setAttributes({ navBorder: value })} min={0} max={100} unit={['px', 'em', '%']} responsive />
									</Fragment>
								}
								{tabStyle == 'underline' &&
									<Fragment>
										<Color label={__('Line Color')} value={navUnderlineBorderColor} onChange={(value) => setAttributes({ navUnderlineBorderColor: value })} />
									</Fragment>
								}
							</Tab>
							<Tab tabTitle={__('Active')}>
								<Color label={__('Color')} value={navColorActive} onChange={(value) => setAttributes({ navColorActive: value })} />
								{tabStyle != 'underline' &&
									<Fragment>
										<Color label={__('Background')} value={navBgActive} onChange={(value) => setAttributes({ navBgActive: value })} />
										<Border label={__('Border')} value={navBorderActive} onChange={(value) => setAttributes({ navBorderActive: value })} min={0} max={100} unit={['px', 'em', '%']} responsive />
									</Fragment>
								}

								{tabStyle == 'underline' &&
									<Fragment>
										<Color label={__('Line Color')} value={navUnderlineBorderColorActive} onChange={(value) => setAttributes({ navUnderlineBorderColorActive: value })} />
									</Fragment>
								}
							</Tab>
						</Tabs>
						<Typography label={__('Typography')} value={typography} onChange={(value) => setAttributes({ typography: value })} disableLineHeight />
					</PanelBody>
					<PanelBody title={__('Icon')} initialOpen={false}>
						<Select
							label={__('Icon Position')}
							options={[['left', __('Left')], ['right', __('Right')], ['top', __('Top')]]}
							value={iconPosition}
							onChange={(value) => setAttributes({ iconPosition: value })} />
						<Range
							label={__('Icon Size')}
							value={iconSize}
							onChange={(value) => setAttributes({ iconSize: value })}
							unit={['px', 'em', '%']}
							min={5}
							max={48}
							responsive />
						<Range
							label={__('Icon Gap')}
							value={iconGap}
							onChange={value => setAttributes({ iconGap: value })}
							unit={['px', 'em', '%']}
							min={0}
							max={64}
							responsive />
					</PanelBody>
					<PanelBody title={__('Body')} initialOpen={false}>
						{tabStyle == 'tabs' &&
							<Fragment>
								<Color label={__('Background Color')} value={bodyBg} onChange={(value) => setAttributes({ bodyBg: value })} />
								<Padding label={__('Padding')} value={bodyPadding} onChange={(value) => setAttributes({ bodyPadding: value })} unit={['px', 'em', '%']} max={100} min={0} responsive />
							</Fragment>
						}
						{tabStyle == 'underline' &&
							<Fragment>
								<Range label={__('Separator Height')} value={bodySeparatorHeight} onChange={(value) => setAttributes({ bodySeparatorHeight: value })} min={0} max={5} unit={['px', 'em', '%']} responsive />
								{bodySeparatorHeight.md > 0 &&
									<Color label={__('Separator Color')} value={bodySeparatorColor} onChange={(value) => setAttributes({ bodySeparatorColor: value })} />
								}
								<Separator />
							</Fragment>
						}
						{tabStyle != 'tabs' &&
							<Range label={__('Spacing')} value={bodyTopSpacing} onChange={(value) => setAttributes({ bodyTopSpacing: value })} unit={['px', 'em', '%']} max={100} min={0} responsive />
						}

						{tabStyle == 'tabs' &&
							<Fragment>
								<Border label={__('Border')} separator value={bodyBorder} onChange={(value) => setAttributes({ bodyBorder: value })} unit={['px', 'em', '%']} max={100} min={0} responsive />
								<BoxShadow label={__('Box-Shadow')} value={bodyShadow} onChange={(value) => setAttributes({ bodyShadow: value })} />
								<BorderRadius label={__('Radius')} separator value={bodyBorderRadius} onChange={(value) => setAttributes({ bodyBorderRadius: value })} unit={['px', 'em', '%']} max={100} min={0} responsive />
							</Fragment>
						}
					</PanelBody>
				</InspectorControls>

				<BlockControls>
					<Toolbar>
						<InlineToolbar
							data={[{ name: 'InlineSpacer', key: 'spacer', responsive: true, unit: ['px', 'em', '%'] }]}
							{...this.props}
							prevState={this.state}
						/>
					</Toolbar>
				</BlockControls>

				<div className={`qubely-block-${uniqueId}`}>
					<div className={`qubely-block-tab qubely-tab-style-${tabStyle}`}>
						<div className={`qubely-tab-nav qubely-alignment-${navAlignment}`}>
							{this.renderTabTitles()}
							<Tooltip text={__('Add new tab')}>
								<span className="qubely-add-new-tab" onClick={() => {
									this.setState({ activeTab: tabs + 1, initialRender: false })
									setAttributes({
										tabs: tabs + 1,
										tabTitles: this.newTitles()
									})
								}} role="button" areaLabel={__('Add new tab')}>
									<i class="fas fa-plus-circle" />
								</span>
							</Tooltip>
						</div>
						<div className={`qubely-tab-body`}>
							<InnerBlocks
								tagName="div"
								template={iterator.map(tabIndex => ['qubely/tab', { id: tabIndex + 1, customClassName: tabIndex == 0 ? `qubely-tab-content qubely-active` : `qubely-tab-content` }])}
								templateLock="all"
								allowedBlocks={['qubely/tab']} />
						</div>
					</div>
				</div>

			</Fragment>
		)
	}
}
export default compose([
	withSelect((select, ownProps) => {
		const { clientId } = ownProps
		const { getBlock } = select('core/editor');
		return {
			block: getBlock(clientId)
		};
	}),
	withDispatch((dispatch) => {
		const { insertBlock, removeBlock, updateBlockAttributes } = dispatch('core/editor');
		return {
			insertBlock,
			removeBlock,
			updateBlockAttributes
		};
	}),
])(Edit)