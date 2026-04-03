defmodule PolarWeb.Publish.UploadController do
  @moduledoc """
  Direct multipart file upload endpoint for the publish pipeline.

  Provides an alternative to the CI/CD icepak workflow: clients can POST
  artifact files directly to the server rather than uploading to S3 first
  and then registering metadata.

  Derived from Hye-Ararat/Image-Server's POST /images endpoint, adapted to
  polar's Space/credential auth and Streams data model.

  ## Endpoints

      POST /publish/products/:product_id/versions/:version_id/upload

  ## Request

  Multipart form with one or more of:
    - `rootfs`    — rootfs.tar.xz (container) or disk.qcow2 (VM)
    - `metadata`  — incus.tar.xz / lxd.tar.xz metadata file
    - `kvmdisk`   — VM disk image (alternative to rootfs for VMs)

  ## Response

  Returns the created Item records with computed hashes and storage paths.
  """

  use PolarWeb, :controller

  alias Polar.Repo
  alias Polar.Streams
  alias Polar.Streams.Product
  alias Polar.Streams.Version
  alias Polar.Streams.Item
  alias Polar.Storage

  action_fallback PolarWeb.FallbackController

  # Maximum upload size: 4 GB
  @max_file_size 4 * 1024 * 1024 * 1024

  def create(
        %{assigns: %{current_space: space}} = conn,
        %{"product_id" => product_id, "version_id" => version_id} = params
      ) do
    with {:ok, product} <- fetch_product(product_id, space),
         {:ok, version} <- fetch_version(version_id, product),
         {:ok, items} <- process_uploads(conn, product, version, params) do
      conn
      |> put_status(:created)
      |> render(:create, %{items: items})
    end
  end

  # ── Private ───────────────────────────────────────────────────────────────────

  defp fetch_product(product_id, _space) do
    case Repo.get(Product, product_id) do
      nil -> {:error, :not_found}
      product -> {:ok, product}
    end
  end

  defp fetch_version(version_id, product) do
    case Repo.get_by(Version, id: version_id, product_id: product.id) do
      nil -> {:error, :not_found}
      version -> {:ok, version}
    end
  end

  defp process_uploads(conn, product, version, params) do
    upload_fields = ~w(rootfs metadata kvmdisk)

    items =
      upload_fields
      |> Enum.flat_map(fn field ->
        case Map.get(params, field) do
          %Plug.Upload{} = upload -> [{field, upload}]
          _ -> []
        end
      end)
      |> Enum.map(fn {field, upload} ->
        store_upload(field, upload, product, version)
      end)

    errors = Enum.filter(items, &match?({:error, _}, &1))

    if errors == [] do
      {:ok, Enum.map(items, fn {:ok, item} -> item end)}
    else
      {:error, errors}
    end
  end

  defp store_upload(field, %Plug.Upload{path: tmp_path, filename: filename}, product, version) do
    with :ok <- validate_file_size(tmp_path),
         {:ok, data} <- File.read(tmp_path),
         hash <- compute_hash(data),
         size <- byte_size(data),
         storage_path <- build_storage_path(product, version, filename),
         :ok <- Storage.put_object(storage_path, data),
         {:ok, item} <- create_item(field, filename, hash, size, storage_path, version) do
      {:ok, item}
    end
  end

  defp validate_file_size(path) do
    case File.stat(path) do
      {:ok, %{size: size}} when size <= @max_file_size -> :ok
      {:ok, %{size: size}} -> {:error, "File too large: #{size} bytes (max #{@max_file_size})"}
      {:error, reason} -> {:error, reason}
    end
  end

  defp compute_hash(data) do
    :crypto.hash(:sha256, data) |> Base.encode16(case: :lower)
  end

  defp build_storage_path(product, version, filename) do
    # Mirrors the path structure used by icepak:
    # <os>/<release>/<arch>/<variant>/<serial>/<filename>
    Path.join([
      product.os,
      product.release,
      product.arch,
      product.variant,
      version.serial,
      filename
    ])
  end

  defp create_item(field, filename, hash, size, storage_path, version) do
    file_type = file_type_for(field, filename)
    is_metadata = field == "metadata"

    Streams.create_item(version, %{
      name: filename,
      file_type: file_type,
      hash: hash,
      size: size,
      path: storage_path,
      is_metadata: is_metadata
    })
  end

  # Map upload field + filename to simplestreams file type
  defp file_type_for("metadata", _filename), do: "incus.tar.xz"
  defp file_type_for("kvmdisk", filename), do: Path.extname(filename) |> String.trim_leading(".")
  defp file_type_for(_field, filename) do
    cond do
      String.ends_with?(filename, ".tar.xz") -> "tar.xz"
      String.ends_with?(filename, ".squashfs") -> "squashfs"
      true -> Path.extname(filename) |> String.trim_leading(".")
    end
  end
end
