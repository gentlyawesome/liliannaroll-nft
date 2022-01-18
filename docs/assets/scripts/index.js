(function () {
  if (typeof window.ethereum !== "undefined" || typeof window.web3 !== "undefined") {
    const provider = window["ethereum"] || window.web3.currentProvider
    console.log({ provider })
  }
})()
