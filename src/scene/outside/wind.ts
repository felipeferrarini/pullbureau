// A gust the flags feel, set by whoever stirs the air in front of the building (the helicopter's rotor wash).
let gust = 0

export const setGust = (value: number) => {
  gust = value
}

export const currentGust = () => gust
