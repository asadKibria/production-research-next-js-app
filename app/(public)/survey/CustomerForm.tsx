"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/app/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/app/components/LanguageToggle";
import { districts } from "@/app/lib/districts";
import { ageGroups } from "@/app/lib/age-groups";
import { residenceTypes } from "@/app/lib/residence-type";
import { professions, PROFESSION_VALUES, PROFESSION_OTHER_VALUE } from "@/app/lib/professions";
import {
  submitCustomerInfo,
  type CustomerFormState,
  type CustomerFormValues,
} from "@/app/lib/actions/customer";

const EMPTY_VALUES: CustomerFormValues = {
  fullName: "",
  district: "",
  residenceType: "",
  age: "",
  gender: "",
  profession: "",
  mobileNumber: "",
};

const initialCustomerFormState: CustomerFormState = {
  error: null,
  fieldErrors: {},
  values: EMPTY_VALUES,
};

const DRAFT_STORAGE_KEY = "hizjaab_customer_form_draft";

function isCustomProfessionValue(value: string) {
  return value !== "" && !PROFESSION_VALUES.includes(value);
}

export function CustomerForm() {
  const { t, locale } = useLanguage();
  const [state, formAction, pending] = useActionState(
    submitCustomerInfo,
    initialCustomerFormState,
  );
  // Controlled values so a failed submission (e.g. bad mobile number) never
  // wipes the fields the customer already filled in correctly — React/the
  // browser reset uncontrolled inputs after every action, success or not.
  // Seeded from the server action's returned values so this also survives a
  // full page reload (progressive-enhancement fallback submits), not just a
  // client-side transition.
  const [values, setValues] = useState<CustomerFormValues>(() => state.values);
  const [useCustomProfession, setUseCustomProfession] = useState(() =>
    isCustomProfessionValue(state.values.profession),
  );
  const districtRef = useRef<HTMLSelectElement>(null);
  const residenceRef = useRef<HTMLSelectElement>(null);
  const ageRef = useRef<HTMLSelectElement>(null);
  const genderRef = useRef<HTMLSelectElement>(null);
  const professionRef = useRef<HTMLSelectElement>(null);

  // The browser's native post-action form reset can desync <select> elements
  // from React's controlled value even though <input> stays in sync — force
  // them back after every action result.
  useEffect(() => {
    if (districtRef.current) districtRef.current.value = values.district;
    if (residenceRef.current) residenceRef.current.value = values.residenceType;
    if (ageRef.current) ageRef.current.value = values.age;
    if (genderRef.current) genderRef.current.value = values.gender;
    if (professionRef.current && !useCustomProfession) {
      professionRef.current.value = values.profession;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Belt-and-suspenders: also restore from sessionStorage on mount, so a
  // literal browser refresh (not just the in-app submit round-trip) doesn't
  // wipe a partially-filled form either.
  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<CustomerFormValues>;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValues((prev) => ({ ...prev, ...parsed }));
        if (typeof parsed.profession === "string") {
          setUseCustomProfession(isCustomProfessionValue(parsed.profession));
        }
      }
    } catch {
      // ignore malformed/unavailable storage
    }
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(values));
    } catch {
      // ignore unavailable storage (e.g. private browsing quota)
    }
  }, [values]);

  const fieldError = (name: string) => state.fieldErrors[name];
  const setField = (name: keyof CustomerFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setValues((prev) => ({ ...prev, [name]: e.target.value }));

  function handleProfessionSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === PROFESSION_OTHER_VALUE) {
      setUseCustomProfession(true);
      setValues((prev) => ({ ...prev, profession: "" }));
    } else {
      setField("profession")(e);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-paper px-6 py-12">
      <div className="mb-6 flex w-full max-w-lg items-center justify-between">
        <Image
          src="/brand/logo-dark.png"
          alt={t("brand")}
          width={110}
          height={44}
          className="h-9 w-auto object-contain"
        />
        <LanguageToggle />
      </div>

      <div className="w-full max-w-lg rounded-3xl border border-cream-200 bg-cream-050 p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-ink-900 sm:text-2xl">{t("form_title")}</h1>
        <p className="mt-1 text-sm text-ink-700">{t("form_subtitle")}</p>

        {state.error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        <form action={formAction} className="mt-6 flex flex-col gap-5">
          <Field label={t("form_full_name")} error={fieldError("fullName")}>
            <input
              name="fullName"
              type="text"
              required
              className="input"
              maxLength={120}
              value={values.fullName}
              onChange={setField("fullName")}
            />
          </Field>

          <Field label={t("form_district")} error={fieldError("district")}>
            <select
              ref={districtRef}
              name="district"
              required
              className="input"
              value={values.district}
              onChange={setField("district")}
            >
              <option value="" disabled>
                {t("form_district_placeholder")}
              </option>
              {districts.map((d) => (
                <option key={d.value} value={d.value}>
                  {locale === "bn" ? d.bn : d.value}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("form_city_village")} error={fieldError("residenceType")}>
            <select
              ref={residenceRef}
              name="residenceType"
              required
              className="input"
              value={values.residenceType}
              onChange={setField("residenceType")}
            >
              <option value="" disabled>
                —
              </option>
              {residenceTypes.map((r) => (
                <option key={r.value} value={r.value}>
                  {locale === "bn" ? r.bn : r.value}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t("form_age")} error={fieldError("age")}>
              <select
                ref={ageRef}
                name="age"
                required
                className="input"
                value={values.age}
                onChange={setField("age")}
              >
                <option value="" disabled>
                  —
                </option>
                {ageGroups.map((g) => (
                  <option key={g.value} value={g.value}>
                    {locale === "bn" ? g.bn : g.value}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t("form_gender")} error={fieldError("gender")}>
              <select
                ref={genderRef}
                name="gender"
                required
                className="input"
                value={values.gender}
                onChange={setField("gender")}
              >
                <option value="" disabled>
                  —
                </option>
                <option value="male">{t("form_gender_male")}</option>
                <option value="female">{t("form_gender_female")}</option>
                <option value="other">{t("form_gender_other")}</option>
              </select>
            </Field>
          </div>

          <Field label={t("form_profession")} error={fieldError("profession")}>
            {useCustomProfession ? (
              <div className="flex flex-col gap-2">
                <input
                  name="profession"
                  type="text"
                  required
                  autoFocus
                  className="input"
                  maxLength={120}
                  value={values.profession}
                  onChange={setField("profession")}
                />
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomProfession(false);
                    setValues((prev) => ({ ...prev, profession: "" }));
                  }}
                  className="self-start text-xs font-medium text-plum-900 underline"
                >
                  {t("form_profession_pick_preset")}
                </button>
              </div>
            ) : (
              <select
                ref={professionRef}
                name="profession"
                required
                className="input"
                value={values.profession}
                onChange={handleProfessionSelect}
              >
                <option value="" disabled>
                  {t("form_profession_placeholder")}
                </option>
                {professions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {locale === "bn" ? p.bn : p.value}
                  </option>
                ))}
                <option value={PROFESSION_OTHER_VALUE}>{t("form_profession_other")}</option>
              </select>
            )}
          </Field>

          <Field label={t("form_mobile")} error={fieldError("mobileNumber")}>
            <input
              name="mobileNumber"
              type="tel"
              inputMode="numeric"
              placeholder="01XXXXXXXXX"
              className="input"
              maxLength={11}
              value={values.mobileNumber}
              onChange={setField("mobileNumber")}
            />
          </Field>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-plum-900 px-6 py-3.5 text-base font-medium text-cream-050 shadow-lg shadow-plum-900/20 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
          >
            {t("form_submit")}
          </button>
        </form>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--color-cream-200);
          background: var(--color-paper);
          padding: 0.7rem 1rem;
          font-size: 0.95rem;
          color: var(--color-ink-900);
          outline: none;
          transition: border-color 0.15s ease;
        }
        .input:focus {
          border-color: var(--color-plum-700);
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
