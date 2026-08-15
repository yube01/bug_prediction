# How Complexity is Calculated (Absolute Simplest Explanation)

Cyclomatic complexity is simply a count of **how many choices (paths)** are inside a function.

### The Rule:
* Every function starts with a base score of **1**.
* Add **+1** for every `if` check, loop (`for` / `while`), or connector (`and` / `or`).

---

### Concrete Example:
If you write a function to calculate shipping rates, and it has:
* **10** different `if` checks (checking country, weight, member discount, express delivery, etc.)

Its complexity is:
$$\text{Base Score (1)} + \text{10 choices} = \mathbf{11}$$

This means a developer would have to write at least **11 separate unit tests** just to cover every possible path through that single function. That is why any score of **10 or higher** is flagged as a risk.
