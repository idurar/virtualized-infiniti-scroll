import React from "react"
import { render } from "react-dom"

import {
  CellMeasurer,
  CellMeasurerCache,
  createMasonryCellPositioner,
  Masonry,
  AutoSizer,
  InfiniteLoader,
  WindowScroller,
} from "react-virtualized"

const limit = 1000
let fetchCount = 1
let imageId = 10

//******************************* */

const CARD = {
  WIDTH: 180,
  HEIGHT: 230,
}

class App extends React.Component {
  state = {
    columnCount: 0,
    items: [],
  }

  getCollections = () => {
    const newImages = []
    for (let i = 0; i < 50; i++) {
      const image = (
        <img
          width="180px"
          height="230px"
          src={`https://picsum.photos/180/230?image=${imageId++}`}
          alt="gallery image"
        />
      )
      newImages.push(image)
    }
    const { items } = this.state
    const newitems = items.concat(newImages)
    this.setState({ items: newitems })
  }

  componentDidMount() {
    this.getCollections()
  }

  _cache = new CellMeasurerCache({
    fixedHeight: true,
    fixedWidth: true,
    defaultHeight: CARD.HEIGHT,
  })

  _config = {
    columnWidth: CARD.WIDTH,
    gutterSize: 10,
    overscanByPixels: CARD.HEIGHT,
  }

  getPositionerConfig = (width) => {
    const { gutterSize } = this._config
    const columnCount = this.getColumnCount(width)
    return {
      columnCount,
      columnWidth: CARD.WIDTH,
      spacer: gutterSize,
    }
  }

  resetCellPositioner = (width) => {
    const config = this.getPositionerConfig(width)
    this._cellPositioner.reset(config)
  }

  getColumnCount = (width) => {
    const { columnWidth, gutterSize } = this._config
    const columnCount = Math.floor(width / (columnWidth + gutterSize))
    this.setState({ columnCount })
    return columnCount
  }

  initCellPositioner(width) {
    if (typeof this._cellPositioner === "undefined") {
      const config = this.getPositionerConfig(width)
      this._cellPositioner = createMasonryCellPositioner({
        cellMeasurerCache: this._cache,
        ...config,
      })
    }
  }

  onResize = ({ width }) => {
    this.resetCellPositioner(width)
    this._masonry.recomputeCellPositions()
  }

  isRowLoaded = ({ index }) => {
    return this.state.items[index]
  }

  loadMoreRows = async () => {
    console.log("loadmore", fetchCount++)
    let { items } = this.state
    if (items.length < limit) {
      this.getCollections()
    }
  }

  cellRenderer = (config) => {
    const { index, key, parent, style } = config
    const item = this.state.items[index]
    let content
    content = item ? (
      <div
        style={{
          width: "180px",
          height: "230px",
          textAlign: "center",
          backgroundColor: "#ccc",
        }}
      >
        {item}
      </div>
    ) : null
    return (
      <CellMeasurer cache={this._cache} index={index} key={key} parent={parent}>
        <div
          style={{
            ...style,
            width: CARD.WIDTH,
            height: CARD.HEIGHT,
          }}
        >
          {content}
        </div>
      </CellMeasurer>
    )
  }

  renderMasonry =
    (registerChild, onRowsRendered, height, scrollTop) =>
    ({ width }) => {
      this.initCellPositioner(width)
      const { items } = this.state

      return (
        <Masonry
          cellCount={items.length}
          cellMeasurerCache={this._cache}
          cellPositioner={this._cellPositioner}
          cellRenderer={this.cellRenderer}
          autoHeight
          height={height}
          scrollTop={scrollTop}
          overscanByPixels={CARD.HEIGHT}
          ref={(ref) => (this._masonry = ref)}
          onCellsRendered={onRowsRendered}
          width={width}
        />
      )
    }

  renderAutoSizer =
    () =>
    ({ registerChild, onRowsRendered }) => {
      return (
        <WindowScroller overscanByPixels={CARD.HEIGHT}>
          {({ height, scrollTop }) => (
            <AutoSizer
              disableHeight
              onResize={this.onResize}
              height={height}
              scrollTop={scrollTop}
            >
              {this.renderMasonry(
                registerChild,
                onRowsRendered,
                height,
                scrollTop
              )}
            </AutoSizer>
          )}
        </WindowScroller>
      )
    }

  renderInfiniteLoader = () => {
    const { items } = this.state
    const hasMore = items.length < limit
    return (
      <InfiniteLoader
        isRowLoaded={this.isRowLoaded}
        loadMoreRows={this.loadMoreRows}
        rowCount={hasMore ? items.length + 1 : items.length}
        threshold={5}
      >
        {this.renderAutoSizer()}
      </InfiniteLoader>
    )
  }

  render() {
    const { items } = this.state
    if (!items) return null

    return (
      <div>
        <div style={{ margin: "20px" }}>
          <strong>Infinite-scroll with Masonry (react-virtualized )</strong>
        </div>
        {this.renderInfiniteLoader()}
      </div>
    )
  }
}

render(<App />, document.getElementById("root"))
