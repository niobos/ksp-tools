Terminology
-----------

We have the following variables.
Upper case are givens, lower case are unknowns.

* $D$ : the desired wet/dry ratio of the craft to obtain
  the requested $∆v = ISP \cdot G_0 \cdot ln(D)$
* $P$ : the payload mass
* $n$ : the number of engines
* $E$ : the (empty) mass of the engine
* $C_i$ : the available storage capacity for fuel type $i$
  in a single engine
* $f = \sum_i f_i$ : the amount of fuel mass needed of type $i$
* $t_i$ : the (empty) tank mass for fuel type $i$
* $W_i = (t_i + f_i) / t_i$ : the wet/dry ratio of the fuel tanks for fuel $i$
* $\sum_i F_i = 1$ : the mass fraction of each fuel in the mix

The set of fuel types $R$ can be split into 4 disjoint sets:

* $R_{int}$ : Internal fuel, where no external tanks are available
* $R_{both}$ : Fuel that can be stored both internally and externally
* $R_{ext}$ : Fuel that needs to be stored in tanks
* $R_{free}$ : Free fuel such as Air that doesn't need to be stored


Mixed tank Wet/Dry ratio
------------------------

When we have a mix of tanks, we need to combine their individual Wet/Dry ratio's:

$$\frac{
    \sum_{i \in R} \left( t_i + f_i \right)
}{
    \sum_{i \in R} t_i
}$$

With $t_i$ for being the engine mass for internal-only fuels.
We know that $t_i = f_i / (W_i - 1)$: 

$$\frac{
\sum_{i \in R} \left( f_i / (W_i-1) + f_i \right)
}{
\sum_{i \in R} f_i / (W_i-1)
}$$
$$= \frac{
\sum_{i \in R} f_i \left( (1 + W_i - 1) / (W_i-1) \right)
}{
\sum_{i \in R} f_i / (W_i-1)
}$$
$$= \frac{
\sum_{i \in R} f_i \left( W_i / (W_i-1) \right)
}{
\sum_{i \in R} f_i \left( 1 / (W_i-1) \right)
}
$$

Taking into account the fuel distribution $f_i = F_i f$

$$\frac{
\sum_{i \in R} F_i f \left( W_i / (W_i-1) \right)
}{
\sum_{i \in R} F_i f \left( 1 / (W_i-1) \right)
}
$$
$$ = \frac{
f \sum_{i \in R} F_i \left( W_i / (W_i-1) \right)
}{
f \sum_{i \in R} F_i \left( 1 / (W_i-1) \right)
}
$$
$$ = \frac{
\sum_{i \in R} F_i \left( W_i / (W_i-1) \right)
}{
\sum_{i \in R} F_i \left( 1 / (W_i-1) \right)
}
$$


∆v
--

For internal-only fuel, we need $f_i \le C_i$.
For both-fuel, we start by filling the internal storage,
but we can add external if needed.

Calculating the craft's wet/dry ratio gives:
$$
\frac{P + nE
    + \sum_{i \in R_{int}}f_i
    + \sum_{i \in R_{both}}min(f_i, nC_i)
    + \sum_{i \in R_{both}}\left( t_i + max(0, f_i - nC_i) \right)
    + \sum_{i \in R_{ext}}\left( t_i + f_i \right)
}{ P + nE
    + \sum_{i \in R_{both}} t_i
    + \sum_{i \in R_{ext}}t_i
} = D
$$

We can plug in $t_i = f_i / (W_i - 1)$:
$$
\frac{P + nE
    + \sum_{i \in R_{int}}f_i
    + \sum_{i \in R_{both}}min(f_i, nC_i)
    + \sum_{i \in R_{both}}\left( f_i / (W_i - 1) + max(0, f_i - nC_i) \right)
    + \sum_{i \in R_{ext}}\left( f_i / (W_i - 1) + f_i \right)
}{ P + nE
    + \sum_{i \in R_{both}} f_i / (W_i - 1)
    + \sum_{i \in R_{ext}} f_i / (W_i - 1)
} = D
$$

Next we can replace $f_i = F_i f$:
$$
\frac{P + nE
    + \sum_{i \in R_{int}} F_i f
    + \sum_{i \in R_{both}}min(F_i f, nC_i)
    + \sum_{i \in R_{both}}\left( F_i f / (W_i - 1) + max(0, F_i f - nC_i) \right)
    + \sum_{i \in R_{ext}} \left( F_i f / (W_i - 1) + F_i f \right)
}{ P + nE
    + \sum_{i \in R_{both}} F_i f / (W_i - 1)
    + \sum_{i \in R_{ext}} F_i f / (W_i - 1)
} = D
$$

This gives us only $n$ and $f$ as unknowns.
$n$ can be either determined by the required acceleration:
$F_{thrust} = nF_{engine} = ma$.
But it's also possible that we need to store more
Internal-only fuel, which also requires more engines.

