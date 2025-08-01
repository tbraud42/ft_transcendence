type OptionSelector = {
    element: HTMLElement
    getValue: () => string
    setValue: (value: string) => void
}

export function createOptionSelector(options: {
    label?: string
    values: { value: string; label: string }[]
    selected?: string
    onChange?: (newValue: string) => void
}): OptionSelector {
    let currentValue = options.selected ?? options.values[0]?.value

    const wrapper = document.createElement('div')
    wrapper.className = 'flex flex-col gap-2 text-center'

    if (options.label) {
        const labelEl = document.createElement('label')
        labelEl.className = 'text-sm font-medium text-gray-800 dark:text-white text-center'
        labelEl.textContent = options.label
        wrapper.appendChild(labelEl)
    }

    const container = document.createElement('div')
    container.className = 'flex flex-wrap gap-3 justify-center'
    wrapper.appendChild(container)

    const buttons: Record<string, HTMLButtonElement> = {}

    function updateSelection(newValue: string) {
        currentValue = newValue

        for (const v in buttons) {
            buttons[v].className = `
                px-4 py-2 rounded-xl text-sm font-medium border transition
                bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600
            `
        }

        buttons[newValue].className = `
            px-4 py-2 rounded-xl text-sm font-medium border transition
            bg-blue-600 text-white border-blue-700
        `

        if (options.onChange) options.onChange(newValue)
    }

    for (const { value, label } of options.values) {
        const btn = document.createElement('button')
        btn.textContent = label
        btn.className = value === currentValue
            ? 'px-4 py-2 rounded-xl text-sm font-medium border bg-blue-600 text-white border-blue-700 transition'
            : 'px-4 py-2 rounded-xl text-sm font-medium border bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition'

        btn.onclick = () => updateSelection(value)
        buttons[value] = btn
        container.appendChild(btn)
    }

    return {
        element: wrapper,
        getValue: () => currentValue,
        setValue: (value: string) => {
            if (value in buttons) updateSelection(value)
        }
    }
}