# %%
import matplotlib.pyplot as plt
import numpy as np

# %%
xs = np.linspace(0, 1000, num=1000)

a = 1
k = 0.1


def F(x):
    # return -a / x - k * (x ** (1 / 2))
    return 1 / x


y = [5, 4.9, 4.8, 4.7, 4.5, 3.5, 3, 2.5, 2, 1.5, 1, 0.5, 0.25, 0, 0, 0, 0]
x = [0, 1, 2, 2.5, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 30]

# plt.plot(xs, [F(x) for x in xs])

# 1/xs

fit = np.polyfit(x, y, 5)
fit_fn = np.poly1d(fit)
# plt.plot(xs, fit_fn(xs), '--k')
plt.scatter(x, y)
plt.plot(x, fit_fn(x), "--k")

print(fit)

# %%
plt.plot(xs, fit_fn(xs), "--k")


# %%
def f(x):
    return fit[0] * x**5 + fit[1] * x**4 + fit[2] * x**3 + fit[3] * x**2 + fit[4] * x + fit[5]


plt.plot(x, [f(x_) for x_ in x], "--k")
# %%
