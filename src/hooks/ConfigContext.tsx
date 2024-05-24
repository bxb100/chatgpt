import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import initialActions, { IAction } from "../constants/initialActions";
import { useLocalStorage } from "@raycast/utils/dist/useLocalStorage";
import { useModel } from "./useModel";
import { Model } from "../type";

type ConfigContextType = {
  value: IAction[] | undefined;
  isLoading: boolean;
  addAction: (action: IAction) => Promise<void>;
  updateAction: (action: IAction) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  setDefaultAction: (id: string) => Promise<void>;
  modelData: Model[];
  defaultAction: () => IAction | undefined;
  initIsLoading: boolean;
  modelIsLoading: boolean;
};

export const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading, value, setValue } = useLocalStorage<IAction[]>("actions");
  const { data: modelData, isLoading: modelIsLoading } = useModel();
  const [initIsLoading, setInitIsLoading] = useState(true);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    setInitIsLoading(true);
    if (value == undefined) {
      setValue(initialActions).then(() => setInitIsLoading(false));
    }
    setInitIsLoading(false);
  }, [isLoading]);

  const addAction = useCallback(
    async (newAction: IAction) => {
      await setValue([newAction, ...(value || [])]);
    },
    [value]
  );

  const updateAction = useCallback(
    async (action: IAction) => {
      await setValue(
        (value || []).map((a) => {
          if (a.id === action.id) {
            return action;
          }
          return a;
        })
      );
    },
    [value]
  );

  const deleteAction = useCallback(
    async (id: string) => {
      const newActions = (value || []).filter((action) => action.id !== id);
      await setValue(newActions);
    },
    [value]
  );

  const setDefaultAction = useCallback(
    async (id: string) => {
      const newActions = (value || []).map((action) => {
        if (action.id === id) {
          return { ...action, default: true };
        }
        return { ...action, default: false };
      });
      await setValue(newActions);
    },
    [value]
  );

  const defaultAction = useCallback(() => {
    return (value || []).find((action) => action.default);
  }, [value]);

  return (
    <ConfigContext.Provider
      value={{
        value,
        addAction,
        deleteAction,
        isLoading,
        setDefaultAction,
        modelData,
        updateAction,
        defaultAction,
        initIsLoading,
        modelIsLoading,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};
