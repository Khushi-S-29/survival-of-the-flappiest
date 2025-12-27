export class Neuron {
  weights: number[] = [];

  predict(input: number[]): number {
    while (this.weights.length <=input.length) {
      this.weights.push(Math.random() * 2 - 1);
    }
    let sum = 0;
    for (let i = 0; i < input.length; i++) {
      sum += this.weights[i] * input[i];
    }
    sum+=this.weights[this.weights.length - 1];
    return sum > 0 ? 1 : 0; //step activation function
  }
}

export class Layer{
  neurons: Neuron[] =[];

  constructor(numNeurons: number) {
    for (let i=0; i < numNeurons;i++) {
      this.neurons.push(new Neuron());
    }
  }
  predict(input: number[]): number[] {
    return this.neurons.map(n => n.predict(input));
  }
}

export class Net{
  layers: Layer[] = [];

  constructor() {
    this.init();
  }

  init():void {
    this.layers.push(new Layer(3));
    this.layers.push(new Layer(3));
    this.layers.push(new Layer(1));
  }

  predict(input: number[]): boolean {
    let currentInput = input;
    for (const l of this.layers) {
      currentInput = l.predict(currentInput);
    }
    return currentInput[0] > 0;
  }
}

export function mutate(parentNet: Net): Net {
  const mutation = new Net();

  for (let i = 0; i<parentNet.layers.length; i++) {
    for (let j=0; j < parentNet.layers[i].neurons.length;j++) {
      for (let k = 0; k<parentNet.layers[i].neurons[j].weights.length; k++) {
        if (Math.random() < 0.05) { // 5% mutation rate
          mutation.layers[i].neurons[j].weights[k] = Math.random() * 2 - 1;
        }else {
          mutation.layers[i].neurons[j].weights[k] = parentNet.layers[i].neurons[j].weights[k];
        }
      }
    }
  }
  return mutation;
}