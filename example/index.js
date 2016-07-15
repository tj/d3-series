
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import Chart from '../index'

const gen = n => {
  const ok = []
  const client = []
  const server = []
  const net = []

  for (var i = 0; i < n; i++) {
    const rnd = Math.random()
    const time = new Date(Date.now() + (i * 3600000))
    const value = Math.random() * 5 | 0

    if (rnd > .9) {
      net.push({ time, value })
      server.push({ time, value: 0 })
      client.push({ time, value: 0 })
      ok.push({ time, value: 0 })
    } else if (rnd > .8) {
      server.push({ time, value })
      net.push({ time, value: 0 })
      client.push({ time, value: 0 })
      ok.push({ time, value: 0 })
    } else if (rnd > .6) {
      client.push({ time, value })
      server.push({ time, value: 0 })
      net.push({ time, value: 0 })
      ok.push({ time, value: 0 })
    } else {
      ok.push({ time, value })
      server.push({ time, value: 0 })
      client.push({ time, value: 0 })
      net.push({ time, value: 0 })
    }
  }

  return [
    { name: 'Success', type: 'success', data: ok },
    { name: 'Client', type: 'client', data: client },
    { name: 'Server', type: 'server', data: server },
    { name: 'Network', type: 'net', data: net }
  ]
}

class App extends Component {
  componentDidMount() {
    this.a = new Chart({
      target: this.refs.a,
      ease: 'ease-out',
      xDomain: [new Date(new Date - 25 * 3600000)],
      height: 250
    })

    this.b = new Chart({
      target: this.refs.b,
      ease: 'elastic',
      height: 250
    })

    this.a.render(gen(80))
    this.b.render(gen(150))
  }

  componentDidUpdate() {
    this.changeData()
  }

  changeData = e => {
    const to = Math.max(1, Math.random() * 5 | 0)
    const n = Math.random() * 150 | 0
    this.a.update(gen(n).slice(0, to))
    this.b.update(gen(n).slice(0, to))
  }

  render() {
    return <div>
      <div id="actions">
        <button onClick={this.changeData}>Animate</button>
      </div>

      <section>
        <h3>Defaults</h3>
        <p>Chart default settings.</p>
        <svg ref="a" className="chart"></svg>
      </section>

      <section className="dark">
        <h3>Dark</h3>
        <p>Chart with dark theme.</p>
        <svg ref="b" className="chart dark"></svg>
      </section>
    </div>
  }
}

ReactDOM.render(<App />, document.querySelector('#app'))
