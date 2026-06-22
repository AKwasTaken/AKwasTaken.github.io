## Separable Extension

Let $L/K$ be a field extension.

Let  

$$
\sigma : K \to \Omega
$$

be an embedding into an algebraic closure $\Omega$.

Define

$$
E_\sigma = \{\text{all extensions of } \sigma \text{ to } L\}.
$$

The **separable degree** of $L/K$ is defined as

$$
[L : K]_{\mathrm{sep}} = |E_\sigma|.
$$

---

## Independence of the Embedding

Let  

$$
\sigma : K \to \Omega
\quad\text{and}\quad
\eta : K \to \Omega'
$$

be two embeddings into algebraic closures $\Omega$ and $\Omega'$ respectively.

### Claim

There exists a bijection

$$
E_\sigma \longleftrightarrow E_\eta.
$$

---

### Construction of the Bijection

We have:

$$
\sigma(K) \subset \Omega,
\qquad
\eta(K) \subset \Omega'.
$$

The map

$$
\eta \circ \sigma^{-1} : \sigma(K) \to \eta(K)
$$

is an isomorphism.

Since:

- $\Omega$ is an algebraic closure of $\sigma(K)$,
- $\Omega'$ is an algebraic closure of $\eta(K)$,

the isomorphism extends to an isomorphism

$$
\tau : \overline{\sigma(K)} \to \overline{\eta(K)}.
$$

Thus we may replace $\Omega$ and $\Omega'$ by

$$
\overline{\sigma(K)} \quad\text{and}\quad \overline{\eta(K)}
$$

respectively.

Now define a map:

$$
E_\sigma \to E_\eta,
\qquad
\widetilde{\sigma} \mapsto \tau \circ \widetilde{\sigma}.
$$

---

### Verification

Let $\widetilde{\sigma} \in E_\sigma$, so

$$
\widetilde{\sigma}|_K = \sigma.
$$

We check that:

$$
(\tau \circ \widetilde{\sigma})|_K = \eta.
$$

For $a \in K$,

$$
(\tau \circ \widetilde{\sigma})(a)
=
\tau(\widetilde{\sigma}(a))
=
\tau(\sigma(a))
=
(\eta \circ \sigma^{-1})(\sigma(a))
=
\eta(a).
$$

Thus

$$
\tau \circ \widetilde{\sigma} \in E_\eta.
$$

This gives a bijection.

Hence the separable degree is independent of the choice of embedding and algebraic closure.

---

## Bounding the Number of Embeddings

Let:

- $K$ be a field,
- $\overline{K}$ an algebraic closure,
- $\alpha \in L$ algebraic over $K$,
- $L = K(\alpha)$.

Let  

$$
m_{\alpha,K}(x)
$$

be the minimal polynomial of $\alpha$ over $K$.

If  

$$
\sigma : K \to \overline{K}
$$

and  

$$
\widetilde{\sigma} : K(\alpha) \to \overline{K}
$$

is an extension of $\sigma$, then:

$$
\widetilde{\sigma}(\alpha)
$$

must be a root of

$$
m_{\alpha,K}(x).
$$

Thus:

$$
|E_\sigma| \le \deg m_{\alpha,K}
=
[K(\alpha) : K].
$$

---

This gives the fundamental inequality:

$$
[L : K]_{\mathrm{sep}} \le [L : K].
$$

Equality holds exactly when the extension is separable.