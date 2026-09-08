import { useMemo, useReducer } from "react";
import { SpecificationItem } from "../../shared/types";
import { accessibilityRules } from "../../rules/accessibility-rules";
import { computeVerbalization, UNSPECIFIED_TYPE_KEY } from "../../rules/engine";

type Action =
  | { type: "SET_ITEMS"; items: SpecificationItem[] }
  | { type: "ADD_ITEM"; item: SpecificationItem }
  | { type: "SET_MARKUP_TYPE"; id: string; markupType: string }
  | { type: "SET_VERBALIZATION"; id: string; text: string }
  | { type: "REMOVE"; id: string }
  | { type: "REORDER"; fromIndex: number; toIndex: number };

function renumber(items: SpecificationItem[]): SpecificationItem[] {
  return items.map((item, index) => ({ ...item, order: index }));
}

function sortedByOrder(items: SpecificationItem[]): SpecificationItem[] {
  return [...items].sort((a, b) => a.order - b.order);
}

function reducer(state: SpecificationItem[], action: Action): SpecificationItem[] {
  switch (action.type) {
    case "SET_ITEMS":
      return renumber(sortedByOrder(action.items));

    case "ADD_ITEM":
      return renumber([...sortedByOrder(state), action.item]);

    case "SET_MARKUP_TYPE": {
      // Seção 13 do briefing de Handoff: alterar o "Tipo de marcação"
      // aplica a regra correspondente QUANDO HOUVER uma — ou seja,
      // quando a categoria escolhida é a mesma que a regra
      // originalmente identificada (item.ruleKey) já produzia, a
      // verbalização calculada por aquela regra é restaurada. Caso
      // contrário (categoria escolhida manualmente, sem regra
      // específica para ela), a verbalização é limpa para edição —
      // nunca inventamos conteúdo para uma combinação sem regra.
      return state.map((item) => {
        if (item.id !== action.id) return item;

        if (action.markupType === UNSPECIFIED_TYPE_KEY) {
          return { ...item, markupType: action.markupType, verbalization: "", verbalizationEdited: false };
        }

        const originalRule = item.ruleKey ? accessibilityRules.find((r) => r.key === item.ruleKey) : undefined;
        const ruleMatchesNewType = originalRule?.markupType === action.markupType;

        return {
          ...item,
          markupType: action.markupType,
          verbalization: ruleMatchesNewType ? computeVerbalization(originalRule, item.extractedData) : "",
          verbalizationEdited: false
        };
      });
    }

    case "SET_VERBALIZATION":
      return state.map((item) =>
        item.id === action.id ? { ...item, verbalization: action.text, verbalizationEdited: true } : item
      );

    case "REMOVE":
      // Seção 22: remover recalcula os números. Preserva edições dos
      // itens restantes (seção 20).
      return renumber(sortedByOrder(state.filter((item) => item.id !== action.id)));

    case "REORDER": {
      const ordered = sortedByOrder(state);
      const [moved] = ordered.splice(action.fromIndex, 1);
      ordered.splice(action.toIndex, 0, moved);
      // Seção 20: reordenar nunca altera o texto de verbalização,
      // apenas recalcula os números (`order`).
      return renumber(ordered);
    }

    default:
      return state;
  }
}

export function useSpecificationStore() {
  const [items, dispatch] = useReducer(reducer, []);

  const api = useMemo(
    () => ({
      setItems: (items: SpecificationItem[]) => dispatch({ type: "SET_ITEMS", items }),
      addItem: (item: SpecificationItem) => dispatch({ type: "ADD_ITEM", item }),
      setType: (id: string, markupType: string) => dispatch({ type: "SET_MARKUP_TYPE", id, markupType }),
      setVerbalization: (id: string, text: string) => dispatch({ type: "SET_VERBALIZATION", id, text }),
      remove: (id: string) => dispatch({ type: "REMOVE", id }),
      reorder: (fromIndex: number, toIndex: number) => dispatch({ type: "REORDER", fromIndex, toIndex })
    }),
    []
  );

  return { items: sortedByOrder(items), ...api };
}
