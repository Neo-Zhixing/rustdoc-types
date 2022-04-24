/// A `Crate` is the root of the emitted JSON blob. It contains all type/documentation information
/// about the language items in the local crate, as well as info about external items to allow
/// tools to find or link to them.
interface Crate {
  /// The id of the root [`Module`] item of the local crate.
  root: Id;
  /// The version string given to `--crate-version`, if any.
  crate_version: string | null;
  /// Whether or not the output includes private items.
  includes_private: boolean;
  /// A collection of all items in the local crate as well as some external traits and their
  /// items that are referenced locally.
  index: { [id: Id]: Item };
  /// Maps IDs to fully qualified paths and other info helpful for generating links.
  paths: { [id: Id]: ItemSummary };
  /// Maps `crate_id` of items to a crate name and html_root_url if it exists.
  external_crates: { [id: number]: ExternalCrate };
  /// A single version number to be used in the future when making backwards incompatible changes
  /// to the JSON output.
  format_version: number;
}

interface ExternalCrate {
  name: string;
  html_root_url: string | null;
}

/// For external (not defined in the local crate) items, you don't get the same level of
/// information. This interface should contain enough to generate a link/reference to the item in
/// question, or can be used by a tool that takes the json output of multiple crates to find
/// the actual item definition with all the relevant info.

interface ItemSummary {
  /// Can be used to look up the name and html_root_url of the crate this item came from in the
  /// `external_crates` map.
  crate_id: number;
  /// The list of path components for the fully qualified path of this item (e.g.
  /// `["std", "io", "lazy", "Lazy"]` for `std::io::lazy::Lazy`).
  path: string[];
  /// Whether this item is a struct, trait, macro, etc.
  kind: ItemKind;
}

type Item = {
  /// The unique identifier of this item. Can be used to find this item in various mappings.
  id: Id;
  /// This can be used as a key to the `external_crates` map of [`Crate`] to see which crate
  /// this item came from.
  crate_id: number;
  /// Some items such as impls don't have names.
  name: string | null;
  /// The source location of this item (absent if it came from a macro expansion or inline
  /// assembly).
  span: Span | null;
  /// By default all documented items are public, but you can tell rustdoc to output private items
  /// so this field is needed to differentiate.
  visibility: Visibility;
  /// The full markdown docstring of this item. Absent if there is no documentation at all,
  /// Some("") if there is some documentation but it is empty (EG `#[doc = ""]`).
  docs: string | null;
  /// This mapping resolves [intra-doc links](https://github.com/rust-lang/rfcs/blob/master/text/1946-intra-rustdoc-links.md) from the docstring to their IDs
  links: { [id: string]: Id };
  /// stringified versions of the attributes on this item (e.g. `"#[inline]"`)
  attrs: string[];
  deprecation: Deprecation | null;
} & ItemEnum;

interface Span {
  /// The path to the source file for this span relative to the path `rustdoc` was invoked with.
  filename: string;
  /// Zero indexed Line and Column of the first character of the `Span`
  begin: [number, number];
  /// Zero indexed Line and Column of the last character of the `Span`
  end: [number, number];
}

interface Deprecation {
  since: string | null;
  note: string | null;
}

const enum VisibilityEnum {
  Public = "public",
  /// For the most part items are private by default. The exceptions are associated items of
  /// public traits and variants of public enums.
  Default = "default",
  Crate = "crate",
}

export type Visibility =
  | VisibilityEnum
  | {
      restricted: {
        parent: Id;
        path: string;
      };
    };

type GenericArgs =
  | {
      angle_bracketed: {
        args: GenericArg[];
        bindings: TypeBinding[];
      };
    }
  | {
      parenthesized: {
        inputs: Type[];
        output: Type | null;
      };
    };

type GenericArg =
  | {
      lifetime: string;
    }
  | {
      type: Type;
    }
  | {
      const: Constant;
    }
  | "infer";

interface Constant {
  type: Type;
  expr: string;
  value: string | null;
  is_literal: boolean;
}

interface TypeBinding {
  name: string;
  args: GenericArgs;
  binding: TypeBindingKind;
}

type TypeBindingKind =
  | {
      equality: Term;
    }
  | {
      constraint: GenericBound[];
    };

type Id = string;

const enum ItemKind {
  Module = "module",
  ExternCrate = "extern_crate",
  Import = "import",
  Struct = "struct",
  StructField = "struct_field",
  Union = "union",
  Enum = "enum",
  Variant = "variant",
  Function = "function",
  Typedef = "typedef",
  OpaqueTy = "opaque_ty",
  Constant = "constant",
  Trait = "trait",
  TraitAlias = "trait_alias",
  Method = "method",
  Impl = "impl",
  Static = "static",
  ForeignType = "foreign_type",
  Macro = "macro",
  ProcAttribute = "proc_attribute",
  ProcDerive = "proc_derive",
  AssocConst = "assoc_const",
  AssocType = "assoc_type",
  Primitive = "primitive",
  Keyword = "keyword",
}

type ItemEnum =
  | {
      kind: "module";
      inner: Module;
    }
  | {
      kind: "extern_crate";
      inner: {
        name: string;
        rename: string | null;
      };
    }
  | {
      kind: "import";
      inner: Import;
    }
  | {
      kind: "union";
      inner: Union;
    }
  | {
      kind: "struct";
      inner: Struct;
    }
  | {
      kind: "struct_field";
      inner: Type;
    }
  | {
      kind: "enum";
      inner: Enum;
    }
  | {
      kind: "variant";
      inner: Variant;
    }
  | {
      kind: "function";
      inner: Function;
    }
  | {
      kind: "trait";
      inner: Trait;
    }
  | {
      kind: "trait_alias";
      inner: TraitAlias;
    }
  | {
      kind: "method";
      inner: Method;
    }
  | {
      kind: "impl";
      inner: Impl;
    }
  | {
      kind: "typedef";
      inner: Typedef;
    }
  | {
      kind: "opaque_ty";
      inner: OpaqueTy;
    }
  | {
      kind: "constant";
      inner: Constant;
    }
  | {
      kind: "static";
      inner: Static;
    }
  | {
      kind: "foreign_type";
    }
  | {
      kind: "macro";
      inner: string;
    }
  | {
      kind: "proc_macro";
      inner: ProcMacro;
    }
  | {
      kind: "primitive_type";
      inner: string;
    }
  | {
      kind: "assoc_const";
      inner: {
        type: Type;
        default: string | null;
      };
    }
  | {
      kind: "assoc_type";
      inner: {
        generics: Generics;
        bounds: GenericBound[];
        default: Type | null;
      };
    };
interface Module {
  is_crate: boolean;
  items: Id[];
}

interface Union {
  generics: Generics;
  fields_stripped: boolean;
  fields: Id[];
  impls: Id[];
}

interface Struct {
  struct_type: StructType;
  generics: Generics;
  fields_stripped: boolean;
  fields: Id[];
  impls: Id[];
}

interface Enum {
  generics: Generics;
  variants_stripped: boolean;
  variants: Id[];
  impls: Id[];
}

type Variant =
  | {
      variant_kind: "plain";
    }
  | {
      variant_kind: "tuple";
      variant_inner: Type[];
    }
  | {
      variant_kind: "struct";
      variant_inner: Id[];
    };

const enum StructType {
  Plain = "plain",
  Tuple = "tuple",
  Unit = "unit",
}

interface Header {
  const: boolean;
  unsafe: boolean;
  async: boolean;
  abi: Abi;
}

type Abi =
  | "Rust"
  | {
      C: { unwind: boolean };
    }
  | {
      Cdecl: { unwind: boolean };
    }
  | {
      Stdcall: { unwind: boolean };
    }
  | {
      Fastcall: { unwind: boolean };
    }
  | {
      Aapcs: { unwind: boolean };
    }
  | {
      Win64: { unwind: boolean };
    }
  | {
      SysV64: { unwind: boolean };
    }
  | {
      System: { unwind: boolean };
    }
  | {
      Other: string;
    };

interface Function {
  decl: FnDecl;
  generics: Generics;
  header: Header;
}

interface Method {
  decl: FnDecl;
  generics: Generics;
  header: Header;
  has_body: boolean;
}

interface Generics {
  params: GenericParamDef[];
  where_predicates: WherePredicate[];
}

interface GenericParamDef {
  name: string;
  kind: GenericParamDefKind;
}

type GenericParamDefKind =
  | {
      lifetime: {
        outlives: string[];
      };
    }
  | {
      type: {
        bounds: GenericBound[];
        default: Type | null;
        /// This is normally `false`, which means that this generic parameter is
        /// declared in the Rust source text.
        ///
        /// If it is `true`, this generic parameter has been introduced by the
        /// compiler behind the scenes.
        ///
        /// # Example
        ///
        /// Consider
        ///
        /// ```ignore (pseudo-rust)
        /// fn f(_: impl Trait) {}
        /// ```
        ///
        /// The compiler will transform this behind the scenes to
        ///
        /// ```ignore (pseudo-rust)
        /// fn f<impl Trait: Trait>(_: impl Trait) {}
        /// ```
        ///
        /// In this example, the generic parameter named `impl Trait` (and which
        /// is bound by `Trait`) is synthetic, because it was not originally in
        /// the Rust source text.
        synthetic: boolean;
      };
    }
  | {
      const: {
        type: Type;
        default: string | null;
      };
    };

type WherePredicate =
  | {
      bound_predicate: {
        type: Type;
        bounds: GenericBound[];
      };
    }
  | {
      region_predicate: {
        lifetime: string;
        bounds: GenericBound[];
      };
    }
  | {
      eq_predicate: {
        lhs: Type;
        rhs: Term;
      };
    };

type GenericBound =
  | {
      trait_bound: {
        trait: Type;
        generic_params: GenericParamDef[];
        modifier: TraitBoundModifier;
      };
    }
  | {
      outlives: string;
    };

const enum TraitBoundModifier {
  None = "none",
  Maybe = "maybe",
  MaybeConst = "maybe_const",
}

type Term =
  | {
      type: Type;
    }
  | {
      constant: Constant;
    };

type Type =
  | {
      /// Structs, enums, and traits
      kind: "resolved_path";
      inner: {
        name: string;
        id: Id;
        args: GenericArgs | null;
        param_names: GenericBound[];
      };
    }
  | {
      /// Parameterized types
      kind: "generic";
      inner: string;
    }
  | {
      /// Fixed-size numeric types (plus int/usize/float), char, arrays, slices, and tuples
      kind: "primitive";
      inner: string;
    }
  | {
      /// `extern "ABI" fn`
      kind: "function_pointer";
      inner: FunctionPointer;
    }
  | {
      /// `(string, number, Box<usize>)`
      kind: "tuple";
      inner: Type[];
    }
  | {
      /// `[number]`
      kind: "slice";
      inner: Type;
    }
  | {
      /// [number; 15]
      kind: "array";
      inner: {
        type: Type;
        len: string;
      };
    }
  | {
      /// `impl TraitA + TraitB + ...`
      kind: "impl_trait";
      inner: GenericBound[];
    }
  | {
      /// `_`
      kind: "infer";
    }
  | {
      /// `*mut number`, `*u8`, etc.
      kind: "raw_pointer";
      inner: {
        mutable: boolean;
        type: Type;
      };
    }
  | {
      /// `&'a mut string`, `&str`, etc.
      kind: "borrowed_ref";
      inner: {
        lifetime: string | null;
        mutable: boolean;
        type: Type;
      };
    }
  | {
      /// `<Type as Trait>::Name` or associated types like `T::Item` where `T: Iterator`
      kind: "qualified_path";
      inner: {
        name: string;
        args: GenericArgs;
        self_type: Type;
        trait: Type;
      };
    };

interface FunctionPointer {
  decl: FnDecl;
  generic_params: GenericParamDef[];
  header: Header;
}

interface FnDecl {
  inputs: [string, Type][];
  output: Type | null;
  c_variadic: boolean;
}

interface Trait {
  is_auto: boolean;
  is_unsafe: boolean;
  items: Id[];
  generics: Generics;
  bounds: GenericBound[];
  implementations: Id[];
}

interface TraitAlias {
  generics: Generics;
  params: GenericBound[];
}

interface Impl {
  is_unsafe: boolean;
  generics: Generics;
  provided_trait_methods: string[];
  trait: Type | null;
  for: Type;
  items: Id[];
  negative: boolean;
  synthetic: boolean;
  blanket_impl: Type | null;
}

interface Import {
  /// The full path being imported.
  source: string;
  /// May be different from the last segment of `source` when renaming imports:
  /// `use source as name;`
  name: string;
  /// The ID of the item being imported.
  id: Id | null; // FIXME is this actually ever None?
  /// Whether this import uses a glob: `use source::*;`
  glob: boolean;
}

interface ProcMacro {
  kind: MacroKind;
  helpers: string[];
}

enum MacroKind {
  /// A bang macro `foo!()`.
  Bang = "bang",
  /// An attribute macro `#[foo]`.
  Attr = "attr",
  /// A derive macro ``
  Derive = "derive",
}

interface Typedef {
  type: Type;
  generics: Generics;
}

interface OpaqueTy {
  bounds: GenericBound[];
  generics: Generics;
}

interface Static {
  type: Type;
  mutable: boolean;
  expr: string;
}
