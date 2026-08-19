---
title: DAV Lab Code Explanation
date: 2026-08-19
---

### 1. Setup & Dataset Generation

```python
np.random.seed(0)
N_pos, N_neg = 200, 200
H1, H2 = 4, 2   # neurons in hidden layers

```

* **`np.random.seed(0)`:** Locks the random number generator so you get the exact same "random" points and initial weights every time you run it.
* **`N_pos, N_neg`:** Sets a target of 200 positive points (inside diamond) and 200 negative points (outside diamond).
* **`H1, H2`:** Defines the size of your hidden layers (Layer 1 has 4 neurons; Layer 2 has 2 neurons).

```python
def inside_diamond(x, y):
    return np.abs(x) + np.abs(y) <= 1

```

* The mathematical formula for a diamond centered at the origin: $\vert{}x\vert{} + \vert{}y\vert{} \le 1$. If a point satisfies this, it's inside (Class 1); otherwise, outside (Class 0).

```python
pos_points, neg_points = [], []
while len(pos_points) < N_pos or len(neg_points) < N_neg:
    p = np.random.uniform(-2, 2, size=(1, 2))
    if inside_diamond(p[0,0], p[0,1]):
        if len(pos_points) < N_pos:
            pos_points.append(p)
    else:
        if len(neg_points) < N_neg:
            neg_points.append(p)

```

* Repeatedly samples random 2D points $(x, y)$ uniformly between $[-2, 2]$ until it collects exactly 200 inside points and 200 outside points.

```python
pos_points = np.vstack(pos_points)
neg_points = np.vstack(neg_points)

data = np.vstack((pos_points, neg_points))
labels = np.array([1]*N_pos + [0]*N_neg)

idx = np.random.permutation(len(data))
data = data[idx]
labels = labels[idx]

```

* **`np.vstack`:** Stacks the list of arrays into a single $(400, 2)$ matrix.
* **`labels`:** Creates an array of 200 ones followed by 200 zeros.
* **`np.random.permutation`:** Shuffles both data points and labels together so the network doesn't train on all ones first, then all zeros.

```python
# Add bias to input layer
data = np.hstack((np.ones((data.shape[0], 1)), data)) 

```

* Adds a column of `1.0`s to the front of every data point. A point $(x, y)$ becomes $[1.0, x, y]$.
* **Why?** This is the **bias trick**. Instead of calculating $W x + b$, we append a constant $1$ to $x$ so the bias term is absorbed directly into the weight matrix.

---

### 2. Activation Functions

```python
def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def sigmoid_deriv(a):
    return a * (1 - a)

```

* **`sigmoid(z)`:** Squashes any real-valued number into a probability between $0$ and $1$.
* **`sigmoid_deriv(a)`:** Calculates the derivative (slope) of the sigmoid function. Notice the argument `a` is already the output of `sigmoid(z)`. Since $\sigma'(z) = \sigma(z)(1 - \sigma(z))$, this is simply $a(1 - a)$.

---

### 3. Forward Pass Function

```python
def forward(x, W1, W2, w3, b3):
    # Layer 1
    z1 = W1 @ x
    h1 = sigmoid(z1)
    
    # Layer 2
    z2 = W2 @ h1
    h2 = sigmoid(z2)
    
    # Output layer
    out_raw = w3 @ h2 + b3
    y_hat = sigmoid(out_raw)
    
    return h1, h2, y_hat, z1, z2, out_raw

```

Pushes a single data point vector $x$ (shape $3 \times 1$) through the network:

1. **Layer 1:** Multiplies $W_1$ ($4 \times 3$) by $x$ ($3 \times 1$) to get $z_1$ ($4 \times 1$), then squashes it via sigmoid to get activation $h_1$.
2. **Layer 2:** Multiplies $W_2$ ($2 \times 4$) by $h_1$ ($4 \times 1$) to get $z_2$ ($2 \times 1$), then squashes it to get $h_2$.
3. **Output Layer:** Multiplies weight vector $w_3$ ($2 \times 1$) by $h_2$ and adds scalar bias $b_3$ to get `out_raw`. Then squashes it to get $\hat{y}$ (the predicted probability that this point is inside the diamond).
4. Returns all intermediate values because backpropagation needs them to calculate gradients.

---

### 4. Backpropagation Function (`grad_params`)

```python
def grad_params(x, y, W1, W2, w3, b3):
    # Forward pass to get current values
    h1, h2, y_hat, z1, z2, out_raw = forward(x, W1, W2, w3, b3)
    
    # Output layer gradient
    dL_dyhat = y_hat - y
    dL_dout = dL_dyhat
    grad_w3 = dL_dout * h2
    grad_b3 = dL_dout

```

* **`dL_dout = y_hat - y`:** For binary cross-entropy loss with sigmoid output, the derivative of loss with respect to `out_raw` simplifies to $(\hat{y} - y)$.
* **`grad_w3 = dL_dout * h2`:** Rate of change of loss with respect to $w_3$. Error multiplied by the input coming into $w_3$ (which is $h_2$).
* **`grad_b3`:** The bias has an input of $1$, so its gradient is just `dL_dout`.

```python
    # Second hidden layer gradient
    dL_dh2 = w3 * dL_dout
    dL_dz2 = dL_dh2 * sigmoid_deriv(h2)
    grad_W2 = np.outer(dL_dz2, h1)

```

* **`dL_dh2 = w3 * dL_dout`:** Passes the output error back across weights $w_3$ to get the error on activation $h_2$.
* **`dL_dz2`:** Chains the activation derivative to pull the error before the sigmoid.
* **`np.outer(dL_dz2, h1)`:** Computes the outer product between the incoming gradient ($2 \times 1$) and the input activation $h_1$ ($4 \times 1$) to produce a $(2 \times 4)$ matrix of weight adjustments for $W_2$.

```python
    # First hidden layer gradient
    dL_dh1 = W2.T @ dL_dz2
    dL_dz1 = dL_dh1 * sigmoid_deriv(h1)
    grad_W1 = np.outer(dL_dz1, x)
    
    return grad_W1, grad_W2, grad_w3, grad_b3

```

* **`dL_dh1 = W2.T @ dL_dz2`:** Propagates the error from layer 2 back through the transpose of matrix $W_2$.
* **`dL_dz1`:** Multiplies by the sigmoid derivative of $h_1$.
* **`grad_W1 = np.outer(dL_dz1, x)`:** Produces a $(4 \times 3)$ gradient matrix to adjust $W_1$.

---

### 5. Training Loop (`train_network`)

```python
def train_network(X, y, lr=0.1, epochs=50, lam=0.0):
    # Initialize weights randomly from a normal distribution
    W1 = np.random.randn(H1, X.shape[1])
    W2 = np.random.randn(H2, H1)
    w3 = np.random.randn(H2)
    b3 = 0.0
    
    for epoch in range(epochs):
        for xi, yi in zip(X, y):
            # 1. Compute gradients for this point
            grad_W1, grad_W2, grad_w3, grad_b3 = grad_params(xi, yi, W1, W2, w3, b3)
            
            # 2. Update weights (Stochastic Gradient Descent)
            W1 -= lr * (grad_W1 + lam * W1)
            W2 -= lr * (grad_W2 + lam * W2)
            w3 -= lr * (grad_w3 + lam * w3)
            b3 -= lr * grad_b3
            
    return W1, W2, w3, b3

```

* Iterates over the entire dataset point-by-point (**Stochastic Gradient Descent**).
* For each point $(x_i, y_i)$, it calculates gradients and shifts each weight by $-\text{lr} \times \text{gradient}$.
* `lam * W` represents **L2 regularization (weight decay)**, which penalizes large weights to prevent overfitting (here `lam=0.0`, so it is turned off).

---

### 6. Visualization Functions

```python
def plot_decision(ax, W1, W2, w3, b3, title):
    xx, yy = np.meshgrid(np.linspace(-2,2,300), np.linspace(-2,2,300))
    grid = np.c_[np.ones(xx.size), xx.ravel(), yy.ravel()]
    Z = []
    for xi in grid:
        _, _, y_hat, _, _, _ = forward(xi, W1, W2, w3, b3)
        Z.append(y_hat)
    Z = np.array(Z).reshape(xx.shape)
    ax.contourf(xx, yy, Z, levels=[0, 0.5, 1], colors=['blue', 'red'], alpha=0.5)
    ax.contour(xx, yy, Z, levels=[0.5], colors='k')
    ...

```

* Creates a fine grid of 90,000 $(x, y)$ coordinate points across the 2D space.
* Feeds every grid point through the trained network (`forward`) to get its predicted probability $\hat{y}$.
* **`contourf` & `contour`:** Colors areas where $\hat{y} > 0.5$ in red, areas where $\hat{y} \le 0.5$ in blue, and draws a black line right along the boundary ($\hat{y} = 0.5$).

```python
# Second hidden layer activations plot
H2_out = []
for xi in data:
    _, h2, _, _, _, _ = forward(xi, W1, W2, w3, b3)
    H2_out.append(h2)
H2_out = np.array(H2_out)

ax.scatter(H2_out[labels==0,0], H2_out[labels==0,1], c='blue', alpha=0.5, label='y=0')
ax.scatter(H2_out[labels==1,0], H2_out[labels==1,1], c='red', alpha=0.5, label='y=1')

```

* Passes all 400 training points through the trained network and records the 2D output values of Hidden Layer 2 ($h_2$).
* Plots those transformed coordinates. You will see that in this 2D latent space, the diamond has been "unfolded" so that red and blue points are cleanly separated by a single straight line.